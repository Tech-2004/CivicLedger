// Triage step 6: confirm back to the citizen (PRD 3.3 step 6).
//
// The SLA timer is already running - it opens at case creation in stepRoute.

import { withSystem } from "../../db";
import { appendEvent } from "../../domain/audit";

export async function stepNotify(reportId: string): Promise<void> {
  return withSystem(async (db) => {
    const row = await db.one<{ contact: string | null; case_id: string | null }>(
      `SELECT contact, case_id FROM reports WHERE id = $1`,
      [reportId],
    );

    // TODO: deliver the confirmation via the citizen's contact (email/SMS) when
    // one was supplied. Reports are anonymous by default, so `contact` is often
    // null and there is nothing to send.
    await appendEvent(db, {
      reportId,
      caseId: row?.case_id ?? null,
      eventType: "NOTIFIED",
      payload: { hasContact: Boolean(row?.contact) },
    });
  });
}
