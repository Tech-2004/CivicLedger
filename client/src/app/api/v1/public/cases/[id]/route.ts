// GET /api/v1/public/cases/[id] - public case detail: photos (approved only),
// public timeline, SLA badge, status. No PII (PRD 3.5).
import { getPublicCase } from "@civicledger/server";
import { json, notFound } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const detail = await getPublicCase(id);
  if (!detail) return notFound("Case not found");
  return json(detail, {
    headers: { "cache-control": "public, max-age=15, s-maxage=30" },
  });
}
