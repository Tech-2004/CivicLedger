// Non-terminal case writes for the Department Console: status changes and notes.
// Terminal resolutions live in ./resolve.ts because they carry extra proof rules.

import { withRls } from "../../db";
import { appendEvent } from "../../domain/audit";
import { isTerminalStatus } from "../../domain/sla";
import { operatorContext } from "../shared/rlsContext";
import type { MutationResult } from "./types";
import type { CaseStatus, OperatorIdentity } from "@civicledger/shared";

/**
 * Moves a case between non-terminal statuses.
 *
 * RESOLVED / WONT_FIX are rejected here: they require a proof photo or a reason
 * code (PRD 3.4), so they must go through `resolveCase`.
 */
export async function updateCaseStatus(
  identity: OperatorIdentity,
  caseId: string,
  status: CaseStatus,
): Promise<MutationResult> {
  if (isTerminalStatus(status)) {
    return {
      ok: false,
      error: "Use the resolve action (proof photo or reason code required).",
    };
  }

  return withRls(operatorContext(identity), async (db) => {
    const updated = await db.one<{ id: string }>(
      `UPDATE cases SET status = $2 WHERE id = $1 RETURNING id`,
      [caseId, status],
    );
    // No row came back: either it doesn't exist or RLS refused the write. The
    // message stays deliberately vague so it can't be used to probe for the
    // existence of cases in other jurisdictions.
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

/** Adds an internal or public note to a case. */
export async function addCaseNote(
  identity: OperatorIdentity,
  caseId: string,
  body: string,
  isPublic: boolean,
): Promise<MutationResult> {
  return withRls(operatorContext(identity), async (db) => {
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
