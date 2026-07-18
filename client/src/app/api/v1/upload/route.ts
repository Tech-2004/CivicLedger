// POST /api/v1/upload - issues a direct-to-Blob client upload token (PRD 3.2
// step 4). Media uploads bypass the ingest request path entirely; the client
// uploads straight to Vercel Blob and attaches the returned URL on submit.
import { NextRequest } from "next/server";
import { createUploadToken } from "@civicledger/server";
import { json, serverError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createUploadToken(body, req);
    return json(result);
  } catch (err) {
    return serverError(err instanceof Error ? err.message : "Upload failed");
  }
}
