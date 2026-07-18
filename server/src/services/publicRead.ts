// Public Dashboard services (PRD 3.5). Runs in the 'public' RLS context, which
// can only read public-safe rows/views. No PII, ever, reaches these results.

import { withPublic } from "../db";
import { slaBadge } from "../domain/sla";
import type {
  CaseStatus,
  Category,
  PublicCase,
} from "@civicledger/shared";

export interface PublicFilters {
  category?: Category;
  status?: CaseStatus;
  jurisdictionId?: string;
  limit: number;
  offset: number;
}

interface CaseRow {
  id: string;
  category: Category;
  status: CaseStatus;
  report_count: number;
  sla_deadline: string | null;
  created_at: string;
  resolved_at: string | null;
  lat: number;
  lng: number;
}

function toPublicCase(r: CaseRow): PublicCase {
  return {
    id: r.id,
    category: r.category,
    status: r.status,
    location: { lat: r.lat, lng: r.lng },
    reportCount: r.report_count,
    slaBadge: slaBadge(r.status, r.sla_deadline, r.created_at),
    slaDeadline: r.sla_deadline,
    createdAt: r.created_at,
    resolvedAt: r.resolved_at,
  };
}

export async function listPublicCases(
  filters: PublicFilters,
): Promise<PublicCase[]> {
  return withPublic(async (db) => {
    const where: string[] = [];
    const params: unknown[] = [];
    if (filters.category) {
      params.push(filters.category);
      where.push(`category = $${params.length}`);
    }
    if (filters.status) {
      params.push(filters.status);
      where.push(`status = $${params.length}`);
    }
    if (filters.jurisdictionId) {
      params.push(filters.jurisdictionId);
      where.push(`jurisdiction_id = $${params.length}`);
    }
    params.push(filters.limit);
    params.push(filters.offset);

    const rows = await db.query<CaseRow>(
      `SELECT id, category, status, report_count, sla_deadline, created_at,
              resolved_at,
              ST_Y(primary_location::geometry) AS lat,
              ST_X(primary_location::geometry) AS lng
       FROM cases
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return rows.map(toPublicCase);
  });
}

export async function getPublicCase(caseId: string) {
  return withPublic(async (db) => {
    const kase = await db.one<CaseRow>(
      `SELECT id, category, status, report_count, sla_deadline, created_at,
              resolved_at,
              ST_Y(primary_location::geometry) AS lat,
              ST_X(primary_location::geometry) AS lng
       FROM cases WHERE id = $1`,
      [caseId],
    );
    if (!kase) return null;

    // Only moderation-APPROVED media is exposed (public_case_media view).
    const media = await db.query<{ report_id: string; photo_url: string; created_at: string }>(
      `SELECT report_id, photo_url, created_at
       FROM public_case_media WHERE case_id = $1 ORDER BY created_at ASC`,
      [caseId],
    );

    // Public timeline = public notes only (internal notes never leak).
    const publicNotes = await db.query<{ body: string; created_at: string }>(
      `SELECT body, created_at FROM case_notes
       WHERE case_id = $1 AND is_public = true ORDER BY created_at ASC`,
      [caseId],
    );

    return {
      case: toPublicCase(kase),
      media,
      publicNotes,
    };
  });
}

export interface Rollup {
  jurisdiction_id: string;
  category: string;
  status: string;
  case_count: number;
  report_count: number;
  overdue_count: number;
  avg_resolution_seconds: number | null;
}

/** Precomputed aggregates for dashboard summary tiles (PRD 3.5 + SLO 800ms). */
export async function getRollups(jurisdictionId?: string): Promise<Rollup[]> {
  return withPublic((db) =>
    db.query<Rollup>(
      `SELECT jurisdiction_id, category, status, case_count, report_count,
              overdue_count, avg_resolution_seconds
       FROM case_rollups
       ${jurisdictionId ? "WHERE jurisdiction_id = $1" : ""}
       ORDER BY category, status`,
      jurisdictionId ? [jurisdictionId] : [],
    ),
  );
}
