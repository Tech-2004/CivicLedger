// One-shot queries that do NOT open an RLS session.
//
// CAUTION: statements issued through `sql` run without the app.* GUCs that the
// RLS policies read, so `app_current_role()` falls back to 'public'. Use it
// only for statements that are independent of row-level scoping - for example
// invoking a SECURITY DEFINER maintenance function. For anything that reads or
// writes tenant data, use withSystem / withRls / withPublic instead.

import { pool } from "./pool";
import type { SqlRow } from "./types";

/**
 * Tagged-template query helper:
 *
 *   await sql`SELECT refresh_case_rollups()`
 *   await sql`SELECT * FROM cases WHERE id = ${caseId}`
 *
 * Interpolated values become bound parameters ($1, $2, ...) rather than being
 * concatenated into the statement, so interpolation is not an injection vector.
 */
export async function sql<T = SqlRow>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  let text = "";
  strings.forEach((chunk, i) => {
    text += chunk;
    if (i < values.length) text += `$${i + 1}`;
  });

  const result = await pool().query(text, values);
  return result.rows as T[];
}
