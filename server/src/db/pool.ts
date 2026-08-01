// The shared connection pool.
//
// Serverless note: DATABASE_URL must point at a connection pooler (Supabase /
// pgBouncer in transaction mode). Each warm function instance keeps its own
// small pool, so the external pooler is what actually prevents Postgres
// connection exhaustion when many instances are warm at once.

import pg from "pg";
import { env } from "../env";
import { log } from "../logger";

const { Pool } = pg;

let instance: pg.Pool | null = null;

/** Lazily creates (and then reuses) the process-wide pool. */
export function pool(): pg.Pool {
  if (!instance) {
    instance = new Pool({ connectionString: env.databaseUrl });

    // Errors on IDLE clients surface as a pool 'error' event, not as a rejected
    // query promise. Node treats an unhandled 'error' event as fatal, so
    // without this listener a routine event (the pooler closing an idle
    // connection) would take the whole process down.
    instance.on("error", (err) => {
      log.error("db.pool.idle_client_error", { error: err.message });
    });
  }
  return instance;
}

/**
 * Closes the pool. Intended for scripts and tests that need the process to exit
 * cleanly; request handlers should leave the pool open for reuse.
 */
export async function closePool(): Promise<void> {
  if (instance) {
    const closing = instance;
    instance = null;
    await closing.end();
  }
}
