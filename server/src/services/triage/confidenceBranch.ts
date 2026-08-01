// Triage step 3: the hard confidence branch (PRD 3.3 step 3).
//
//   c >= T_ROUTE              -> auto-continue
//   T_REVIEW <= c < T_ROUTE   -> continue, tagged "needs review"
//   c <  T_REVIEW             -> Manual Review Queue, skip auto dedup/route
//
// The thresholds and the decision itself live in domain/confidence.ts; this step
// only persists the outcome and records why it was taken.

import { withSystem } from "../../db";
import { appendEvent } from "../../domain/audit";
import { decideConfidenceBranch } from "../../domain/confidence";
import type { RoutingPath } from "@civicledger/shared";

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
