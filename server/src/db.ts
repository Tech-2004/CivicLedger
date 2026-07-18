// Database access for a serverless runtime (Neon Postgres).
//
// Two shapes of access:
//   1. `sql` tagged template  - one-shot queries over HTTP (no session state).
//                               Used only where RLS context is irrelevant.
//   2. session helpers        - open a pooled connection, run inside a
//      (withSystem / withRls /  transaction with SET LOCAL app.* GUCs so
//       withPublic)            Postgres RLS applies. This is how the console,
//                              triage workflow, and public reads talk to the DB.
//
// RLS design lives in server/db/migrations/0002_rls.sql.

import pg from "pg";
const { Pool } = pg;
import type { PoolClient } from "pg";
import { env } from "./env";

// ---- one-shot query mimicking Neon's sql (no RLS session) ----------------
export const sql = Object.assign(
  async (strings: TemplateStringsArray | string, ...values: any[]) => {
    const poolInstance = pool();
    if (typeof strings === "string") {
      const res = await poolInstance.query(strings, values);
      return res.rows;
    }
    let text = "";
    for (let i = 0; i < strings.length; i++) {
      text += strings[i];
      if (i < values.length) {
        text += `$${i + 1}`;
      }
    }
    const res = await poolInstance.query(text, values);
    return res.rows;
  },
  {}
);

// ---- pooled sessions for RLS-scoped work ---------------------------------
let _pool: pg.Pool | null = null;
function pool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString: env.databaseUrl });
  }
  return _pool;
}

export type SessionRole =
  | "system"
  | "department"
  | "reviewer"
  | "admin"
  | "public";

export interface RlsContext {
  role: SessionRole;
  jurisdictionId?: string | null;
  departmentId?: string | null;
}

export interface Db {
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T[]>;
  one<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T | null>;
}

/**
 * Runs `fn` inside a transaction with RLS session GUCs applied via SET LOCAL,
 * so every statement is scoped by the Postgres policies.
 */
export async function withContext<T>(
  ctx: RlsContext,
  fn: (db: Db) => Promise<T>,
): Promise<T> {
  const client: PoolClient = await pool().connect();
  try {
    await client.query("BEGIN");
    // set_config(..., true) => LOCAL to this transaction. Parameterized to
    // avoid injection via context values.
    await client.query("SELECT set_config('app.current_role', $1, true)", [
      ctx.role,
    ]);
    await client.query(
      "SELECT set_config('app.current_jurisdiction_id', $1, true)",
      [ctx.jurisdictionId ?? ""],
    );
    await client.query(
      "SELECT set_config('app.current_department_id', $1, true)",
      [ctx.departmentId ?? ""],
    );

    const db: Db = {
      async query<R = Record<string, unknown>>(text: string, params?: unknown[]) {
        const res = await client.query(text, params);
        return res.rows as R[];
      },
      async one<R = Record<string, unknown>>(text: string, params?: unknown[]) {
        const res = await client.query(text, params);
        return (res.rows[0] as R) ?? null;
      },
    };

    const result = await fn(db);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Full-access context used by ingest + the triage workflow. */
export function withSystem<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  return withContext({ role: "system" }, fn);
}

/** Operator context (department / reviewer / admin) - RLS-scoped. */
export function withRls<T>(
  ctx: {
    role: Exclude<SessionRole, "system" | "public">;
    jurisdictionId?: string | null;
    departmentId?: string | null;
  },
  fn: (db: Db) => Promise<T>,
): Promise<T> {
  return withContext(ctx, fn);
}

/** Anonymous public reads - only sees public-safe rows/views. */
export function withPublic<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  return withContext({ role: "public" }, fn);
}
