// Terminal case resolution (PRD 3.4).
//
// Closing a case requires evidence: either a proof photo or an explicit reason
// code. Enforced here at the service boundary as well as in the route's schema,
// so the rule holds no matter which caller reaches it.

import { withRls } from "../../db";
import { appendEvent } from "../../domain/audit";
import { operatorContext } from "../shared/rlsContext";
import type { MutationResult, ResolveInput } from "./types";
import type { OperatorIdentity } from "@civicledger/shared";

export async function resolveCase(
  identity: OperatorIdentity,
  caseId: string,
  input: ResolveInput,
): Promise<MutationResult> {
  if (!input.proofPhotoUrl && !input.reasonCode) {
    return {
      ok: false,
      error: "Resolution requires either a proof photo or a reason code.",
    };
  }

  return withRls(operatorContext(identity), async (db) => {
    const updated = await db.one<{ id: string }>(
      `UPDATE cases
       SET status = $2, resolved_at = now(),
           resolution_photo_url = $3, resolution_reason_code = $4
       WHERE id = $1 RETURNING id`,
      [
        caseId,
        input.status,
        input.proofPhotoUrl ?? null,
        input.reasonCode ?? null,
      ],
    );
    if (!updated) return { ok: false, error: "not found or not permitted" };

    if (input.publicNote) {
      await db.query(
        `INSERT INTO case_notes (case_id, author_id, body, is_public)
         VALUES ($1, $2, $3, true)`,
        [caseId, identity.operatorId, input.publicNote],
      );
    }

    await appendEvent(db, {
      caseId,
      eventType: "RESOLVED",
      payload: {
        status: input.status,
        hasProof: Boolean(input.proofPhotoUrl),
        reasonCode: input.reasonCode ?? null,
      },
      actor: identity.operatorId,
    });
    return { ok: true };
  });
}
