// Append-only audit log (PRD 3.3 step 7). Every meaningful transition writes a
// report_events row, including which confidence branch was taken and why.

import type { Db } from "../db";
import type { EventType } from "@civicledger/shared";

export interface AuditEvent {
  reportId?: string | null;
  caseId?: string | null;
  eventType: EventType;
  payload: Record<string, unknown>;
  actor?: string; // 'system' or an operator id
}

export async function appendEvent(db: Db, event: AuditEvent): Promise<void> {
  await db.query(
    `INSERT INTO report_events (report_id, case_id, event_type, payload, actor)
     VALUES ($1, $2, $3, $4::jsonb, $5)`,
    [
      event.reportId ?? null,
      event.caseId ?? null,
      event.eventType,
      JSON.stringify(event.payload ?? {}),
      event.actor ?? "system",
    ],
  );
}
