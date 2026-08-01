// RLS-scoped transactions.
//
// Every operator/public/system database access goes through here. The pattern is
// always: open a transaction, publish the caller's scope into transaction-local
// settings, then let the Postgres policies do the enforcement. Queries in the
// services layer are therefore a second line of defence, not the only one.
//
// Policy definitions live in db/migrations/0002_rls.sql.

import type { PoolClient } from "pg";
import { pool } from "./pool";
import type { Db, OperatorRole, RlsContext, SqlRow } from "./types";

/** Session settings the RLS policies read. Must match 0002_rls.sql. */
const GUC = {
  role: "app.current_role",
  jurisdictionId: "app.current_jurisdiction_id",
  departmentId: "app.current_department_id",
} as const;

/**
 * Narrows a pg client down to the `Db` surface. Callers get `query`/`one` only,
 * so they cannot issue their own COMMIT/ROLLBACK and step outside the
 * transaction that carries the RLS context.
 */
function bindClient(client: PoolClient): Db {
  return {
    async query<T = SqlRow>(text: string, params?: unknown[]): Promise<T[]> {
      const result = await client.query(text, params);
      return result.rows as T[];
    },
    async one<T = SqlRow>(text: string, params?: unknown[]): Promise<T | null> {
      const result = await client.query(text, params);
      return (result.rows[0] as T | undefined) ?? null;
    },
  };
}

/**
 * Runs `fn` inside a transaction whose session carries `ctx`, so every statement
 * is scoped by the RLS policies.
 */
export async function withContext<T>(
  ctx: RlsContext,
  fn: (db: Db) => Promise<T>,
): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");

    // set_config(..., true) scopes each setting to THIS transaction, so a
    // pooled connection can never leak one request's scope into the next.
    // Names and values are bound parameters, so no context value can inject
    // SQL. All three are set in a single round trip.
    await client.query(
      `SELECT set_config($1, $2, true),
              set_config($3, $4, true),
              set_config($5, $6, true)`,
      [
        GUC.role,
        ctx.role,
        GUC.jurisdictionId,
        ctx.jurisdictionId ?? "",
        GUC.departmentId,
        ctx.departmentId ?? "",
      ],
    );

    const result = await fn(bindClient(client));
    await client.query("COMMIT");
    return result;
  } catch (err) {
    // If the ROLLBACK itself fails the connection is already unusable. Swallow
    // that secondary failure so the original error is what propagates.
    try {
      await client.query("ROLLBACK");
    } catch {
      /* connection already broken - nothing useful to do */
    }
    throw err;
  } finally {
    client.release();
  }
}

/** Full-access machine context: ingest and the triage workflow. */
export function withSystem<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  return withContext({ role: "system" }, fn);
}

/** Operator context (department / reviewer / admin) - RLS-scoped. */
export function withRls<T>(
  ctx: {
    role: OperatorRole;
    jurisdictionId?: string | null;
    departmentId?: string | null;
  },
  fn: (db: Db) => Promise<T>,
): Promise<T> {
  return withContext(ctx, fn);
}

/** Anonymous public reads - sees only public-safe rows and views. */
export function withPublic<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  return withContext({ role: "public" }, fn);
}
