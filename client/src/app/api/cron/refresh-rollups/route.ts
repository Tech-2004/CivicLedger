// GET /api/cron/refresh-rollups - hourly refresh of the public dashboard
// aggregates (PRD 3.5: "hourly-refreshed rollups"). Wire in vercel.json crons.
// Protected by CRON_SECRET (Vercel sets the Authorization header for crons).
import { sql } from "@civicledger/server";
import { json, unauthorized } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return unauthorized();
  }
  await sql`SELECT refresh_case_rollups()`;
  return json({ ok: true, refreshedAt: new Date().toISOString() });
}
