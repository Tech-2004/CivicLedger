// Triage step 1: moderate (PRD 3.3).
//
// Flagged content never continues into the public pipeline - it diverts to the
// moderation queue (PRD 3.6).

import { withSystem } from "../../db";
import { appendEvent } from "../../domain/audit";
import { moderateReport } from "../../domain/moderation";
import { loadReport } from "./reportRow";

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

    await db.query(`UPDATE reports SET moderation_status = $2 WHERE id = $1`, [
      reportId,
      result.status,
    ]);
    await appendEvent(db, {
      reportId,
      eventType: "MODERATED",
      payload: { status: result.status, labels: result.labels },
    });

    if (result.status === "FLAGGED") {
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
