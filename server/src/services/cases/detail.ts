// Full case detail for the Department Console (PRD 3.4).

import { withRls } from "../../db";
import { operatorContext } from "../shared/rlsContext";
import type { OperatorIdentity } from "@civicledger/shared";

/**
 * Case plus its reports, notes and audit trail.
 *
 * Reports carry PII (citizen contact), so they have no blanket public-read
 * policy - the RLS context established here is what limits them to the
 * operator's jurisdiction.
 */
export async function getCaseDetail(
  identity: OperatorIdentity,
  caseId: string,
) {
  return withRls(operatorContext(identity), async (db) => {
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

    const [reports, notes, events] = await Promise.all([
      db.query(
        `SELECT id, source_channel, description, photo_url, address_text,
                moderation_status, severity, classification_confidence,
                routing_path, status, created_at
         FROM reports WHERE case_id = $1 ORDER BY created_at ASC`,
        [caseId],
      ),
      db.query(
        `SELECT id, body, is_public, author_id, created_at
         FROM case_notes WHERE case_id = $1 ORDER BY created_at ASC`,
        [caseId],
      ),
      db.query(
        `SELECT event_type, payload, actor, created_at
         FROM report_events WHERE case_id = $1 ORDER BY created_at ASC`,
        [caseId],
      ),
    ]);

    return { case: kase, reports, notes, events };
  });
}
