// GET  /api/v1/console/cases/[id]        - full case detail (RLS-scoped)
// PATCH /api/v1/console/cases/[id]        - update non-terminal status
import { NextRequest } from "next/server";
import { statusUpdateSchema } from "@civicledger/shared";
import { getCaseDetail, updateCaseStatus } from "@civicledger/server";
import { requireOperator } from "@/lib/session";
import { json, forbidden, notFound, badRequest } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const operator = await requireOperator(["department", "reviewer", "admin"]);
  if (!operator) return forbidden();
  const { id } = await ctx.params;
  const detail = await getCaseDetail(operator, id);
  if (!detail) return notFound("Case not found");
  return json(detail);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const operator = await requireOperator(["department", "reviewer", "admin"]);
  if (!operator) return forbidden();
  const { id } = await ctx.params;

  const parsed = statusUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest("Invalid status", parsed.error.flatten());

  const result = await updateCaseStatus(operator, id, parsed.data.status);
  if (!result.ok) return badRequest(result.error ?? "Update failed");
  return json({ ok: true });
}
