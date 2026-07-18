// GET /api/v1/review - the Manual Review + Moderation Queue (PRD 3.6).
// Reviewer/admin only. Two entry paths surface here: low-confidence
// classification and flagged content.
import { listReviewQueue } from "@civicledger/server";
import { requireOperator } from "@/lib/session";
import { json, forbidden } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const operator = await requireOperator(["reviewer", "admin"]);
  if (!operator) return forbidden();
  const items = await listReviewQueue(operator);
  return json({ items, count: items.length });
}
