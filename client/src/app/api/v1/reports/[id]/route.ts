// GET /api/v1/reports/[id] - citizen status lookup for the tracking page.
// Returns coarse status only (no PII beyond what the reporter already knows).
import { getReportStatus } from "@civicledger/server";
import { json, notFound } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const row = await getReportStatus(id);
  if (!row) return notFound("Report not found");
  return json({
    reportId: row.id,
    status: row.status,
    moderationStatus: row.moderation_status,
    routingPath: row.routing_path,
    caseId: row.case_id,
    caseStatus: row.case_status,
    createdAt: row.created_at,
  });
}
