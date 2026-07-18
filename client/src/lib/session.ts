// Server-side helpers to resolve the current operator identity from the
// Auth.js session and enforce RBAC in route handlers.
import { auth } from "@/auth";
import type { OperatorIdentity, OperatorRole } from "@civicledger/shared";

export async function getOperator(): Promise<OperatorIdentity | null> {
  const session = await auth();
  const operator = (session as { operator?: OperatorIdentity | null } | null)
    ?.operator;
  return operator ?? null;
}

/** Returns the operator if signed in AND holding one of `roles`, else null. */
export async function requireOperator(
  roles: OperatorRole[],
): Promise<OperatorIdentity | null> {
  const operator = await getOperator();
  if (!operator) return null;
  if (!roles.includes(operator.role)) return null;
  return operator;
}
