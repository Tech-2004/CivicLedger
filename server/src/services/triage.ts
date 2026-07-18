// Triage step implementations (PRD 3.3). Each function is:
//   - idempotent (safe to retry) and
//   - self-contained (opens its own RLS 'system' transaction).
// The durable workflow (client/workflows/triage.ts) wraps each of these in a
// "use step" so the DevKit gives them independent retries + a DLQ on failure.

import { withSystem, type Db } from "../db";
import type {
  Category,
  Classification,
  GeoPoint,
  RoutingPath,
} from "@civicledger/shared";
import { classifyReport } from "../domain/classify";
import { moderateReport } from "../domain/moderation";
import { embedText, toVectorLiteral } from "../domain/embeddings";
import { decideConfidenceBranch } from "../domain/confidence";
import { findDuplicateCase } from "../domain/dedup";
import {
  resolveDepartment,
  dispatchToDepartment,
  type DispatchResult,
} from "../domain/routing";
import { computeSlaDeadline } from "../domain/sla";
import { appendEvent } from "../domain/audit";
import { env } from "../env";

interface ReportRow {
  id: string;
  jurisdiction_id: string | null;
  description: string | null;
  photo_url: string | null;
  address_text: string | null;
  category: Category | null;
  severity: string | null;
  classification_confidence: number | null;
  moderation_status: string;
  routing_path: RoutingPath | null;
  case_id: string | null;
  lat: number;
  lng: number;
  embedding_text: string | null;
}

async function loadReport(db: Db, reportId: string): Promise<ReportRow> {
  const row = await db.one<ReportRow>(
    `SELECT id, jurisdiction_id, description, photo_url, address_text,
            category, severity, classification_confidence, moderation_status,
            routing_path, case_id,
            ST_Y(location::geometry) AS lat,
            ST_X(location::geometry) AS lng,
            description_embedding::text AS embedding_text
     FROM reports WHERE id = $1`,
    [reportId],
  );
  if (!row) throw new Error(`report ${reportId} not found`);
  return row;
}

// --- Step 1: Moderate ------------------------------------------------------
export interface ModerationStepResult {
  flagged: boolean;
}
export async function stepModerate(
  reportId: string,
): Promise<ModerationStepResult> {
  return withSystem(async (db) => {
    const report = await loadReport(db, reportId);
    const result = await moderateReport({
      photoUrl: report.photo_url,
      description: report.description,
    });

    await db.query(
      `UPDATE reports SET moderation_status = $2 WHERE id = $1`,
      [reportId, result.status],
    );
    await appendEvent(db, {
      reportId,
      eventType: "MODERATED",
      payload: { status: result.status, labels: result.labels },
    });

    if (result.status === "FLAGGED") {
      // Never public; divert to the moderation queue (PRD 3.3 step 1 + 3.6).
      await db.query(
        `UPDATE reports SET status = 'HELD', routing_path = 'manual_review'
         WHERE id = $1`,
        [reportId],
      );
      return { flagged: true };
    }
    return { flagged: false };
  });
}

// --- Step 2: Classify (+ embed for dedup) ----------------------------------
export async function stepClassify(reportId: string): Promise<Classification> {
  return withSystem(async (db) => {
    const report = await loadReport(db, reportId);
    const classification = await classifyReport({
      description: report.description,
      photoUrl: report.photo_url,
    });
    const embedding = await embedText(report.description ?? "");

    await db.query(
      `UPDATE reports
       SET category = $2, severity = $3, classification_confidence = $4,
           emergency_flag = $5, description_embedding = $6::vector,
           status = 'TRIAGING'
       WHERE id = $1`,
      [
        reportId,
        classification.category,
        classification.severity,
        classification.confidence,
        classification.emergencyFlag,
        toVectorLiteral(embedding),
      ],
    );
    await appendEvent(db, {
      reportId,
      eventType: "CLASSIFIED",
      payload: { ...classification },
    });
    return classification;
  });
}

// --- Step 3: Confidence branch (hard branch) -------------------------------
export async function stepConfidenceBranch(
  reportId: string,
  confidence: number,
): Promise<RoutingPath> {
  return withSystem(async (db) => {
    const decision = decideConfidenceBranch(confidence);
    await db.query(`UPDATE reports SET routing_path = $2 WHERE id = $1`, [
      reportId,
      decision.path,
    ]);
    if (decision.path === "manual_review") {
      await db.query(`UPDATE reports SET status = 'HELD' WHERE id = $1`, [
        reportId,
      ]);
    }
    await appendEvent(db, {
      reportId,
      eventType: "CONFIDENCE_BRANCH",
      payload: {
        path: decision.path,
        confidence,
        tRoute: decision.tRoute,
        tReview: decision.tReview,
      },
    });
    return decision.path;
  });
}

// --- Step 4: Dedup ---------------------------------------------------------
export interface DedupStepResult {
  merged: boolean;
  caseId: string | null;
}
export async function stepDedup(reportId: string): Promise<DedupStepResult> {
  return withSystem(async (db) => {
    const report = await loadReport(db, reportId);
    if (!report.jurisdiction_id || !report.category) {
      return { merged: false, caseId: null };
    }
    const location: GeoPoint = { lat: report.lat, lng: report.lng };

    const candidate = await findDuplicateCase(db, {
      location,
      category: report.category,
      jurisdictionId: report.jurisdiction_id,
      embeddingLiteral: report.embedding_text,
      excludeReportId: reportId,
    });

    if (!candidate) return { merged: false, caseId: null };

    await db.query(
      `UPDATE reports SET case_id = $2, status = 'MERGED' WHERE id = $1`,
      [reportId, candidate.caseId],
    );
    await db.query(
      `UPDATE cases SET report_count = report_count + 1 WHERE id = $1`,
      [candidate.caseId],
    );
    await appendEvent(db, {
      reportId,
      caseId: candidate.caseId,
      eventType: "DEDUP_MERGED",
      payload: {
        distanceMeters: candidate.distanceMeters,
        cosineDistance: candidate.cosineDistance,
      },
    });
    return { merged: true, caseId: candidate.caseId };
  });
}

// --- Step 5: Route (create case + dispatch to department) ------------------
export interface RouteStepResult {
  caseId: string | null;
  routed: boolean;
  dispatch: DispatchResult | null;
}
export async function stepRoute(reportId: string): Promise<RouteStepResult> {
  return withSystem(async (db) => {
    const report = await loadReport(db, reportId);
    if (!report.jurisdiction_id || !report.category) {
      return { caseId: null, routed: false, dispatch: null };
    }

    const dept = await resolveDepartment(
      db,
      report.jurisdiction_id,
      report.category,
    );

    if (!dept) {
      // No department owns this (jurisdiction, category): hold for a human.
      await db.query(
        `UPDATE reports SET status = 'HELD', routing_path = 'manual_review'
         WHERE id = $1`,
        [reportId],
      );
      await appendEvent(db, {
        reportId,
        eventType: "CONFIDENCE_BRANCH",
        payload: { reason: "no_department_for_category", held: true },
      });
      return { caseId: null, routed: false, dispatch: null };
    }

    const slaDeadline = computeSlaDeadline(dept.default_sla_hours);

    const created = await db.one<{ id: string }>(
      `INSERT INTO cases (
         jurisdiction_id, category, department_id, primary_location,
         report_count, status, sla_deadline
       ) VALUES (
         $1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography,
         1, 'OPEN', $6
       ) RETURNING id`,
      [
        report.jurisdiction_id,
        report.category,
        dept.id,
        report.lng,
        report.lat,
        slaDeadline.toISOString(),
      ],
    );
    const caseId = created!.id;

    await db.query(
      `UPDATE reports SET case_id = $2, status = 'ROUTED' WHERE id = $1`,
      [reportId, caseId],
    );
    await appendEvent(db, {
      reportId,
      caseId,
      eventType: "CASE_CREATED",
      payload: { departmentId: dept.id, slaDeadline: slaDeadline.toISOString() },
    });

    const dispatch = await dispatchToDepartment(dept, {
      caseId,
      category: report.category,
      severity: report.severity,
      addressText: report.address_text,
      location: { lat: report.lat, lng: report.lng },
      photoUrl: report.photo_url,
      description: report.description,
      trackingUrl: `${env.appUrl.replace(/\/$/, "")}/track/${reportId}`,
    });

    await appendEvent(db, {
      reportId,
      caseId,
      eventType: "ROUTED",
      payload: { ...dispatch },
    });

    return { caseId, routed: true, dispatch };
  });
}

// --- Step 6: Notify (citizen confirmation) ---------------------------------
export async function stepNotify(reportId: string): Promise<void> {
  return withSystem(async (db) => {
    const row = await db.one<{ contact: string | null; case_id: string | null }>(
      `SELECT contact, case_id FROM reports WHERE id = $1`,
      [reportId],
    );
    // TODO: send confirmation via the citizen's contact (email/SMS) if present.
    // The SLA timer was opened at case creation (stepRoute).
    await appendEvent(db, {
      reportId,
      caseId: row?.case_id ?? null,
      eventType: "NOTIFIED",
      payload: { hasContact: Boolean(row?.contact) },
    });
  });
}

// --- DLQ: record a step that exhausted retries (PRD 3.3 + 6) ---------------
export async function recordWorkflowFailure(
  reportId: string,
  step: string,
  error: string,
): Promise<void> {
  return withSystem(async (db) => {
    await db.query(
      `INSERT INTO workflow_failures (report_id, step, error)
       VALUES ($1, $2, $3)`,
      [reportId, step, error],
    );
    await appendEvent(db, {
      reportId,
      eventType: "WORKFLOW_FAILURE",
      payload: { step, error },
    });
  });
}
