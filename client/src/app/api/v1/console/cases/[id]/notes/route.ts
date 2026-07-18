// POST /api/v1/console/cases/[id]/notes - add an internal or public note.
import { NextRequest } from "next/server";
import { noteSchema } from "@civicledger/shared";
import { addCaseNote } from "@civicledger/server";
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

  const parsed = noteSchema.safeParse(await req.json());
  if (!parsed.success) return badRequest("Invalid note", parsed.error.flatten());

  await addCaseNote(operator, id, parsed.data.body, parsed.data.isPublic);
  return json({ ok: true });
}
