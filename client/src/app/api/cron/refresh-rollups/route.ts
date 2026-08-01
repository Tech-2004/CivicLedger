// GET /api/cron/refresh-rollups - scheduled refresh of the public dashboard
// aggregates (PRD 3.5). The schedule lives in client/vercel.json (daily, to fit
// the Vercel Hobby plan cron limit).
//
// Protected by CRON_SECRET, which Vercel sends as `Authorization: Bearer ...`.
import { timingSafeEqual } from "node:crypto";
import { log, sql } from "@civicledger/server";
import { json, serverError, unauthorized } from "@/lib/http";

export const runtime = "nodejs";

/** Constant-time comparison so the token can't be probed byte-by-byte. */
function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  // timingSafeEqual throws on length mismatch, so check it first. Leaking the
  // length of a random token is not a meaningful advantage to an attacker.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;

  // Fail CLOSED when unconfigured. This previously skipped the auth check
  // entirely if CRON_SECRET was unset, which left the endpoint publicly
  // callable in any environment that forgot to set it. Local development is
  // still allowed to run it without a secret for convenience.
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      log.error("cron.refresh_rollups.missing_secret");
      return unauthorized("CRON_SECRET is not configured");
    }
  } else if (!tokenMatches(req.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return unauthorized();
  }

  try {
    // refresh_case_rollups() is SECURITY DEFINER (migration 0004) because
    // REFRESH MATERIALIZED VIEW needs ownership and the app role is not owner.
    await sql`SELECT refresh_case_rollups()`;
  } catch (err) {
    // Surface failures instead of reporting ok:true on a refresh that died.
    log.error("cron.refresh_rollups.failed", { error: String(err) });
    return serverError("Rollup refresh failed");
  }

  return json({ ok: true, refreshedAt: new Date().toISOString() });
}
