// POST /api/v1/reports - Thin Ingestion Gateway (PRD 3.2).
// Does only: deterministic emergency check -> validate + idempotency ->
// write minimal PENDING row -> enqueue triage workflow -> 202 + tracking URL.
// No model calls, no dedup, no routing here.

import { NextRequest } from "next/server";
import { reportSubmissionSchema } from "@civicledger/shared";
import { createReport } from "@civicledger/server";
import { start } from "workflow/api";
import { triageWorkflow } from "../../../../../workflows/triage";
import { accepted, badRequest, serverError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = reportSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }
  const s = parsed.data;
  const location = s.location ?? s.manualPin!;

  try {
    const result = await createReport({
      sourceChannel: "app",
      description: s.description ?? null,
      photoUrl: s.photoUrl ?? null,
      location,
      addressText: s.addressText ?? null,
      contact: s.contact ?? null,
      categoryHint: s.categoryHint ?? null,
      idempotencyKey: s.idempotencyKey,
    });

    // Enqueue the async triage workflow (idempotent submissions don't re-enqueue).
    if (!result.duplicateOfSubmission) {
      await start(triageWorkflow, result.reportId);
    }

    // Emergency gate fired -> surface local emergency contact info instead of a
    // normal queue confirmation (PRD s2). The report is still tracked + routed.
    if (result.isEmergency) {
      return accepted({
        status: "emergency",
        emergency: true,
        emergencyNumber: result.emergencyNumber,
        message:
          "This looks like an emergency. Contact local emergency services now.",
        reportId: result.reportId,
        trackingUrl: result.trackingUrl,
      });
    }

    return accepted({
      status: "received",
      reportId: result.reportId,
      trackingUrl: result.trackingUrl,
    });
  } catch (err) {
    return serverError(err instanceof Error ? err.message : "Ingest failed");
  }
}
