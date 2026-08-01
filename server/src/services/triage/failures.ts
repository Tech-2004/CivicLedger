// Dead-letter recording for steps that exhausted their retries (PRD 3.3 + 6).
//
// The durable workflow calls this after a step's final failure so the report can
// be replayed manually instead of disappearing.

import { withSystem } from "../../db";
import { appendEvent } from "../../domain/audit";

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
