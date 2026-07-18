// POST /api/v1/reports/sms - Twilio inbound webhook (PRD s2 + 3.1).
// SMS/MMS is a first-class SUBMISSION channel: it feeds the exact same pipeline
// as the app. Same deterministic emergency gate, same reports row, same triage.

import { NextRequest } from "next/server";
import { twilioInboundSchema } from "@civicledger/shared";
import { createReport, env } from "@civicledger/server";
import { start } from "workflow/api";
import { triageWorkflow } from "../../../../../../workflows/triage";
import { isValidTwilioSignature, twiml } from "@/lib/twilio";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Twilio posts application/x-www-form-urlencoded.
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = String(v);

  // Verify the request really came from Twilio (skip only when unset in dev).
  const authToken = env.twilioAuthToken;
  if (authToken) {
    const ok = isValidTwilioSignature(
      authToken,
      req.headers.get("x-twilio-signature"),
      req.url,
      params,
    );
    if (!ok) return new Response("invalid signature", { status: 403 });
  }

  const parsed = twilioInboundSchema.safeParse(params);
  if (!parsed.success) {
    return twiml("Sorry, we couldn't read that message. Please try again.");
  }
  const m = parsed.data;

  // SMS needs a location to be actionable. Twilio location messages carry
  // Latitude/Longitude; otherwise ask the sender to share their location.
  const lat = m.Latitude ? Number(m.Latitude) : NaN;
  const lng = m.Longitude ? Number(m.Longitude) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return twiml(
      "Thanks! To file this report, please share your location (or reply with the address).",
    );
  }

  const result = await createReport({
    sourceChannel: "sms",
    description: m.Body || null,
    // TODO: MediaUrl0 is a temporary, auth-gated Twilio URL. A follow-up step
    // should copy it into Vercel Blob for persistence + moderation.
    photoUrl: m.MediaUrl0 ?? null,
    location: { lat, lng },
    contact: m.From,
    idempotencyKey: m.MessageSid, // unique per inbound message
  });

  if (!result.duplicateOfSubmission) {
    await start(triageWorkflow, [result.reportId]);
  }

  if (result.isEmergency) {
    return twiml(
      `This may be an emergency. Please call ${result.emergencyNumber} now. Ref: ${result.trackingUrl}`,
    );
  }

  return twiml(
    `Report received. Track status here: ${result.trackingUrl}`,
  );
}
