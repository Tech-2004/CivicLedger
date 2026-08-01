// Shared database types.
//
// Kept in their own module so `domain/*` and `services/*` can import the `Db`
// contract without pulling in the pg driver or the pool singleton.

/** Every role the RLS policies understand (db/migrations/0002_rls.sql). */
export type SessionRole =
  | "system"
  | "department"
  | "reviewer"
  | "admin"
  | "public";

/**
 * Roles that identify a human operator - excludes the machine role ('system')
 * and anonymous reads ('public'). Operator-facing services accept only these.
 */
export type OperatorRole = Exclude<SessionRole, "system" | "public">;

/** Values pushed into the Postgres session so RLS policies can read them. */
export interface RlsContext {
  role: SessionRole;
  jurisdictionId?: string | null;
  departmentId?: string | null;
}

/** Default shape of an untyped result row. */
export type SqlRow = Record<string, unknown>;

/**
 * Minimal query surface handed to callers inside a scoped transaction.
 *
 * Deliberately smaller than pg's `PoolClient`: callers get `query`/`one` and
 * cannot issue their own BEGIN/COMMIT or escape the transaction that carries
 * the RLS context.
 */
export interface Db {
  query<T = SqlRow>(text: string, params?: unknown[]): Promise<T[]>;
  one<T = SqlRow>(text: string, params?: unknown[]): Promise<T | null>;
}
