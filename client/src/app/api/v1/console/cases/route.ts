// GET /api/v1/console/cases - cases assigned to the operator's scope (PRD 3.4).
import { NextRequest } from "next/server";
import { listCases } from "@civicledger/server";
import type { CaseStatus, Category } from "@civicledger/shared";
import { requireOperator } from "@/lib/session";
import { json, forbidden } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const operator = await requireOperator(["department", "reviewer", "admin"]);
  if (!operator) return forbidden();

  const sp = req.nextUrl.searchParams;
  const cases = await listCases(operator, {
    status: (sp.get("status") as CaseStatus) ?? undefined,
    category: (sp.get("category") as Category) ?? undefined,
    overdue: sp.get("overdue") === "true",
  });
  return json({ cases, count: cases.length });
}
