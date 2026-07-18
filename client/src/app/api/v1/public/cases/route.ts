// GET /api/v1/public/cases - public case list with filters (PRD 3.5).
// Polled by the dashboard every 30s. No PII. Cached briefly at the edge.
import { NextRequest } from "next/server";
import { publicFilterSchema } from "@civicledger/shared";
import { listPublicCases } from "@civicledger/server";
import { json, badRequest } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = publicFilterSchema.safeParse(q);
  if (!parsed.success) return badRequest("Invalid filters", parsed.error.flatten());

  const cases = await listPublicCases(parsed.data);
  return json(
    { cases, count: cases.length },
    { headers: { "cache-control": "public, max-age=15, s-maxage=30" } },
  );
}
