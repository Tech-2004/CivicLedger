// GET /api/v1/public/rollups - precomputed aggregates for dashboard tiles.
// Served from the hourly-refreshed materialized view (PRD 3.5 + 800ms SLO).
import { NextRequest } from "next/server";
import { getRollups } from "@civicledger/server";
import { json } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const jurisdictionId =
    req.nextUrl.searchParams.get("jurisdictionId") ?? undefined;
  const rollups = await getRollups(jurisdictionId);
  return json(
    { rollups },
    { headers: { "cache-control": "public, max-age=60, s-maxage=300" } },
  );
}
