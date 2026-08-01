// Case list for the Department Console (PRD 3.4).

import { withRls } from "../../db";
import { isOverdue, slaBadge } from "../../domain/sla";
import { operatorContext } from "../shared/rlsContext";
import { SqlFilters } from "../shared/sqlFilters";
import type { CaseListFilters, CaseListItem, CaseRow } from "./types";
import type { OperatorIdentity } from "@civicledger/shared";

/**
 * SQL form of "past its SLA and still open".
 *
 * Mirrors `isOverdue()` in domain/sla.ts and the FILTER clause in
 * db/migrations/0003_rollups.sql - all three must agree or the dashboard tiles
 * and the console list will report different numbers.
 */
const OVERDUE_PREDICATE = `status NOT IN ('RESOLVED','WONT_FIX')
   AND sla_deadline IS NOT NULL
   AND sla_deadline < now()`;

const MAX_ROWS = 500;

/**
 * Cases the operator is responsible for:
 *   department -> their own department, within their jurisdiction
 *   reviewer   -> their whole jurisdiction
 *   admin      -> unscoped
 *
 * RLS is the actual boundary; these predicates keep the result set small and
 * make the intent explicit at the call site.
 */
export async function listCases(
  identity: OperatorIdentity,
  filters: CaseListFilters = {},
): Promise<CaseListItem[]> {
  return withRls(operatorContext(identity), async (db) => {
    const sqlFilters = new SqlFilters();

    if (identity.role === "department") {
      // eqStrict, not eq: an operator with no jurisdiction must see nothing
      // rather than everything.
      sqlFilters.eqStrict("jurisdiction_id", identity.jurisdictionId);
      // Department operators without a department see their whole jurisdiction.
      sqlFilters.eq("department_id", identity.departmentId);
    } else if (identity.role === "reviewer") {
      sqlFilters.eqStrict("jurisdiction_id", identity.jurisdictionId);
    }
    // admin: intentionally unscoped.

    sqlFilters.eq("status", filters.status);
    sqlFilters.eq("category", filters.category);
    if (filters.overdue) sqlFilters.raw(OVERDUE_PREDICATE);

    const rows = await db.query<CaseRow>(
      `SELECT id, category, status, report_count, sla_deadline, created_at,
              resolved_at, department_id
       FROM cases
       ${sqlFilters.whereClause()}
       ORDER BY (${OVERDUE_PREDICATE}) DESC, created_at DESC
       LIMIT ${MAX_ROWS}`,
      sqlFilters.params(),
    );

    return rows.map((row) => ({
      ...row,
      slaBadge: slaBadge(row.status, row.sla_deadline, row.created_at),
      overdue: isOverdue(row.status, row.sla_deadline),
    }));
  });
}
