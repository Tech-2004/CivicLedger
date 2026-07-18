// Vercel Blob integration.
//
// Media never flows through the ingest request path (PRD 3.2 step 4): the
// client requests a direct-to-Blob upload token, uploads the photo straight
// to Blob, and only the resulting URL is attached to the report.
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { del } from "@vercel/blob";

/**
 * Issues a client upload token. Wired into POST /api/v1/upload.
 * Uploads stay anonymous (reports are anonymous by default) but the token
 * constrains content types + size. Moderation later promotes only APPROVED
 * photos to public visibility.
 */
export async function createUploadToken(
  body: HandleUploadBody,
  request: Request,
) {
  return handleUpload({
    body,
    request,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
      ],
      maximumSizeInBytes: 15 * 1024 * 1024, // 15MB
      addRandomSuffix: true,
      tokenPayload: JSON.stringify({ purpose: "report-media" }),
    }),
    onUploadCompleted: async () => {
      // The client attaches the returned URL to the report on submit; nothing
      // to persist here.
    },
  });
}

export { del as deleteBlob };
