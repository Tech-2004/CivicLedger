// Twilio request signature validation + TwiML reply helpers.
// https://www.twilio.com/docs/usage/webhooks/webhooks-security
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Validates the X-Twilio-Signature header. The signature is:
 *   base64( HMAC-SHA1( authToken, fullUrl + sorted(key+value) ) )
 * NOTE: `fullUrl` must be the exact public URL Twilio requested. Behind a
 * proxy, reconstruct it from x-forwarded-* headers accordingly.
 */
export function isValidTwilioSignature(
  authToken: string,
  signature: string | null,
  fullUrl: string,
  params: Record<string, string>,
): boolean {
  if (!signature) return false;
  const sortedKeys = Object.keys(params).sort();
  let data = fullUrl;
  for (const key of sortedKeys) data += key + params[key];

  const expected = createHmac("sha1", authToken).update(data, "utf8").digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function twiml(message: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(
    message,
  )}</Message></Response>`;
  return new Response(xml, {
    status: 200,
    headers: { "content-type": "text/xml" },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
