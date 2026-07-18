// POST /api/v1/console/cases/[id]/resolve - resolve a case (PRD 3.4).
// Requires EITHER a proof photo OR a reason code - never proof-only.
import { NextRequest } from "next/server";
import { resolveSchema } from "@civicledger/shared";
import { resolveCase } from "@civicledger/server";
import { requireOperator } from "@/lib/session";
import { json, forbidden, badRequest } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const operator = await requireOperator(["department", "reviewer", "admin"]);
  if (!operator) return forbidden();
  const { id } = await ctx.params;

  const parsed = resolveSchema.safeParse(await req.json());
  if (!parsed.success) {
    return badRequest("Invalid resolution", parsed.error.flatten());
  }

  const result = await resolveCase(operator, id, {
    status: parsed.data.status,
    proofPhotoUrl: parsed.data.proofPhotoUrl,
    reasonCode: parsed.data.reasonCode,
    publicNote: parsed.data.publicNote,
  });
  if (!result.ok) return badRequest(result.error ?? "Resolve failed");
  return json({ ok: true });
}
