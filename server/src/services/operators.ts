// Operator identity resolution for RBAC. Auth.js (in the client app) owns the
// login flow; after a successful sign-in it calls this to map the email to an
// operator record + scope, which becomes the RLS context on every request.

import { withSystem } from "../db";
import type { OperatorIdentity } from "@civicledger/shared";

interface OperatorRow {
  id: string;
  email: string;
  name: string | null;
  role: OperatorIdentity["role"];
  jurisdiction_id: string | null;
  department_id: string | null;
}

export async function resolveOperatorByEmail(
  email: string,
): Promise<OperatorIdentity | null> {
  const row = await withSystem((db) =>
    db.one<OperatorRow>(
      `SELECT id, email, name, role, jurisdiction_id, department_id
       FROM operators WHERE email = $1 LIMIT 1`,
      [email],
    ),
  );
  if (!row) return null;
  return {
    operatorId: row.id,
    email: row.email,
    role: row.role,
    jurisdictionId: row.jurisdiction_id,
    departmentId: row.department_id,
  };
}
