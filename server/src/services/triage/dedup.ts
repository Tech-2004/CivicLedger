// Triage step 4: deduplicate against nearby open cases (PRD 3.3 step 4).
//
// A match attaches this report to the existing case instead of opening a new
// one. Matching itself (radius + embedding distance) lives in domain/dedup.ts.

import { withSystem } from "../../db";
import { appendEvent } from "../../domain/audit";
import { findDuplicateCase } from "../../domain/dedup";
import { loadReport } from "./reportRow";
import type { GeoPoint } from "@civicledger/shared";

export interface DedupStepResult {
  merged: boolean;
  caseId: string | null;
}

export async function stepDedup(reportId: string): Promise<DedupStepResult> {
  return withSystem(async (db) => {
    const report = await loadReport(db, reportId);

    // Dedup is scoped to a (jurisdiction, category) pair; without both there is
    // nothing meaningful to compare against.
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
