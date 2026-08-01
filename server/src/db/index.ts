// Database access for a serverless runtime (Supabase Postgres via pg).
//
// Two shapes of access:
//
//   1. RLS-scoped transactions  withSystem / withRls / withPublic
//      Opens a transaction, publishes the caller's scope into transaction-local
//      settings, and lets the Postgres RLS policies enforce boundaries. This is
//      how the console, triage workflow, and public reads talk to the database.
//
//   2. `sql` tagged template
//      One-shot statements with NO RLS session. Only for scope-independent work
//      such as calling a SECURITY DEFINER maintenance function.
//
// RLS design lives in db/migrations/0002_rls.sql.

export { pool, closePool } from "./pool";
export { sql } from "./sql";
export {
  withContext,
  withSystem,
  withRls,
  withPublic,
} from "./context";
export type {
  Db,
  OperatorRole,
  RlsContext,
  SessionRole,
  SqlRow,
} from "./types";
