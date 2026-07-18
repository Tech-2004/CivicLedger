// POST /api/v1/review/[id] - apply a review action to a report (PRD 3.6):
// approve / edit_classification / merge / reject_spam / force_emergency.
import { NextRequest } from "next/server";
import { reviewActionSchema } from "@civicledger/shared";
import { applyReviewAction } from "@civicledger/server";
import { requireOperator } from "@/lib/session";
import { json, forbidden, badRequest } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const operator = await requireOperator(["reviewer", "admin"]);
  if (!operator) return forbidden();
  const { id } = await ctx.params;

  const parsed = reviewActionSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest("Invalid action", parsed.error.flatten());

  const result = await applyReviewAction(operator, id, parsed.data);
  if (!result.ok) return badRequest(result.error ?? "Action failed");
  return json({ ok: true });
}
