// Department Console services (PRD 3.4). All access runs in an RLS-scoped
// transaction built from the operator identity, so the Postgres policies -
// not just these queries - enforce department/jurisdiction boundaries.

import { withRls, type Db } from "../db";
import { appendEvent } from "../domain/audit";
import { slaBadge } from "../domain/sla";
import type {
  CaseStatus,
  Category,
  OperatorIdentity,
  ResolutionReasonCode,
  SlaBadge,
} from "@civicledger/shared";

function ctxOf(identity: OperatorIdentity) {
  return {
    role: identity.role,
    jurisdictionId: identity.jurisdictionId,
    departmentId: identity.departmentId,
  } as const;
}

export interface CaseListItem {
  id: string;
  category: Category;
  status: CaseStatus;
  report_count: number;
  sla_deadline: string | null;
  created_at: string;
  resolved_at: string | null;
  department_id: string | null;
  slaBadge: SlaBadge;
  overdue: boolean;
}

export interface CaseListFilters {
  status?: CaseStatus;
  category?: Category;
  overdue?: boolean;
}

/**
 * Cases the operator is responsible for. Department operators see their own
 * department's cases within their jurisdiction; reviewers/admins see the
 * whole jurisdiction (admins: all).
 */
export async function listCases(
  identity: OperatorIdentity,
  filters: CaseListFilters = {},
): Promise<CaseListItem[]> {
  return withRls(ctxOf(identity), async (db) => {
    const where: string[] = [];
    const params: unknown[] = [];

    if (identity.role === "department") {
      params.push(identity.jurisdictionId);
      where.push(`jurisdiction_id = $${params.length}`);
      if (identity.departmentId) {
        params.push(identity.departmentId);
        where.push(`department_id = $${params.length}`);
      }
    } else if (identity.role === "reviewer") {
      params.push(identity.jurisdictionId);
      where.push(`jurisdiction_id = $${params.length}`);
    }
    // admin: no jurisdiction filter.

    if (filters.status) {
      params.push(filters.status);
      where.push(`status = $${params.length}`);
    }
    if (filters.category) {
      params.push(filters.category);
      where.push(`category = $${params.length}`);
    }
    if (filters.overdue) {
      where.push(
        `status NOT IN ('RESOLVED','WONT_FIX') AND sla_deadline IS NOT NULL AND sla_deadline < now()`,
      );
    }

    const rows = await db.query<Omit<CaseListItem, "slaBadge" | "overdue">>(
      `SELECT id, category, status, report_count, sla_deadline, created_at,
              resolved_at, department_id
       FROM cases
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY (sla_deadline IS NOT NULL AND sla_deadline < now()) DESC,
                created_at DESC
       LIMIT 500`,
      params,
    );

    return rows.map((r) => ({
      ...r,
      slaBadge: slaBadge(r.status, r.sla_deadline, r.created_at),
      overdue:
        r.status !== "RESOLVED" &&
        r.status !== "WONT_FIX" &&
        !!r.sla_deadline &&
        new Date(r.sla_deadline).getTime() < Date.now(),
    }));
  });
}

export async function getCaseDetail(
  identity: OperatorIdentity,
  caseId: string,
) {
  return withRls(ctxOf(identity), async (db) => {
    const kase = await db.one(
      `SELECT id, jurisdiction_id, category, department_id, status,
              report_count, sla_deadline, resolved_at, resolution_photo_url,
              resolution_reason_code, created_at,
              ST_Y(primary_location::geometry) AS lat,
              ST_X(primary_location::geometry) AS lng
       FROM cases WHERE id = $1`,
      [caseId],
    );
    if (!kase) return null;

    // Reports are RLS-scoped (PII). Operators only see their jurisdiction's.
    const reports = await db.query(
      `SELECT id, source_channel, description, photo_url, address_text,
              moderation_status, severity, classification_confidence,
              routing_path, status, created_at
       FROM reports WHERE case_id = $1 ORDER BY created_at ASC`,
      [caseId],
    );
    const notes = await db.query(
      `SELECT id, body, is_public, author_id, created_at
       FROM case_notes WHERE case_id = $1 ORDER BY created_at ASC`,
      [caseId],
    );
    const events = await db.query(
      `SELECT event_type, payload, actor, created_at
       FROM report_events WHERE case_id = $1 ORDER BY created_at ASC`,
      [caseId],
    );

    return { case: kase, reports, notes, events };
  });
}

export async function updateCaseStatus(
  identity: OperatorIdentity,
  caseId: string,
  status: CaseStatus,
): Promise<{ ok: boolean; error?: string }> {
  // Terminal resolutions must carry proof/reason -> use resolveCase().
  if (status === "RESOLVED" || status === "WONT_FIX") {
    return {
      ok: false,
      error: "Use the resolve action (proof photo or reason code required).",
    };
  }
  return withRls(ctxOf(identity), async (db) => {
    const updated = await db.one<{ id: string }>(
      `UPDATE cases SET status = $2 WHERE id = $1 RETURNING id`,
      [caseId, status],
    );
    if (!updated) return { ok: false, error: "not found or not permitted" };
    await appendEvent(db, {
      caseId,
      eventType: "STATUS_CHANGED",
      payload: { status },
      actor: identity.operatorId,
    });
    return { ok: true };
  });
}

export async function addCaseNote(
  identity: OperatorIdentity,
  caseId: string,
  body: string,
  isPublic: boolean,
): Promise<{ ok: boolean }> {
  return withRls(ctxOf(identity), async (db) => {
    await db.query(
      `INSERT INTO case_notes (case_id, author_id, body, is_public)
       VALUES ($1, $2, $3, $4)`,
      [caseId, identity.operatorId, body, isPublic],
    );
    await appendEvent(db, {
      caseId,
      eventType: "NOTE_ADDED",
      payload: { isPublic },
      actor: identity.operatorId,
    });
    return { ok: true };
  });
}

export interface ResolveInput {
  status: "RESOLVED" | "WONT_FIX";
  proofPhotoUrl?: string;
  reasonCode?: ResolutionReasonCode;
  publicNote?: string;
}

export async function resolveCase(
  identity: OperatorIdentity,
  caseId: string,
  input: ResolveInput,
): Promise<{ ok: boolean; error?: string }> {
  // Enforce the PRD 3.4 rule at the service boundary too (defense in depth).
  if (!input.proofPhotoUrl && !input.reasonCode) {
    return {
      ok: false,
      error: "Resolution requires either a proof photo or a reason code.",
    };
  }
  return withRls(ctxOf(identity), async (db: Db) => {
    const updated = await db.one<{ id: string }>(
      `UPDATE cases
       SET status = $2, resolved_at = now(),
           resolution_photo_url = $3, resolution_reason_code = $4
       WHERE id = $1 RETURNING id`,
      [caseId, input.status, input.proofPhotoUrl ?? null, input.reasonCode ?? null],
    );
    if (!updated) return { ok: false, error: "not found or not permitted" };

    if (input.publicNote) {
      await db.query(
        `INSERT INTO case_notes (case_id, author_id, body, is_public)
         VALUES ($1, $2, $3, true)`,
        [caseId, identity.operatorId, input.publicNote],
      );
    }
    await appendEvent(db, {
      caseId,
      eventType: "RESOLVED",
      payload: {
        status: input.status,
        hasProof: Boolean(input.proofPhotoUrl),
        reasonCode: input.reasonCode ?? null,
      },
      actor: identity.operatorId,
    });
    return { ok: true };
  });
}
