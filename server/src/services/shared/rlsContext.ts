// Maps an authenticated operator to the RLS context used for their queries.
//
// Previously duplicated verbatim in services/cases.ts and services/review.ts.
// Keeping one definition means a change to how operator scope is derived cannot
// silently apply to only half the consoles.

import type { OperatorRole } from "../../db";
import type { OperatorIdentity } from "@civicledger/shared";

export interface OperatorRlsContext {
  readonly role: OperatorRole;
  readonly jurisdictionId: string | null;
  readonly departmentId: string | null;
}

/** RLS context for any operator role (department / reviewer / admin). */
export function operatorContext(
  identity: OperatorIdentity,
): OperatorRlsContext {
  return {
    role: identity.role,
    jurisdictionId: identity.jurisdictionId,
    departmentId: identity.departmentId,
  };
}

/**
 * RLS context for consoles restricted to reviewers and admins (the Manual
 * Review / Moderation queue).
 *
 * The route handlers already gate on `requireOperator(["reviewer","admin"])`.
 * This asserts the same invariant at the service boundary (defence in depth):
 * the previous code used an unchecked `as "reviewer" | "admin"` cast, which
 * would have silently handed a department operator reviewer-level scope if a
 * caller ever forgot that gate.
 */
export function reviewerContext(identity: OperatorIdentity): OperatorRlsContext {
  if (identity.role !== "reviewer" && identity.role !== "admin") {
    throw new Error(
      `reviewerContext requires a reviewer or admin operator, received '${identity.role}'`,
    );
  }
  return {
    role: identity.role,
    jurisdictionId: identity.jurisdictionId,
    departmentId: identity.departmentId,
  };
}
