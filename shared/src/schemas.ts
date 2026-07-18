import { z } from "zod";
import {
  CATEGORIES,
  CASE_STATUSES,
  RESOLUTION_REASON_CODES,
} from "./constants";

// Coordinates.
export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// Citizen submission from the app/PWA (PRD 3.1). Photo is optional (no-photo
// path exists, at a lower trust score). Either GPS or a manual pin is required.
export const reportSubmissionSchema = z
  .object({
    description: z.string().max(4000).optional(),
    photoUrl: z.string().url().optional(),
    location: geoPointSchema.optional(),
    // Manual pin (used when GPS is unavailable) resolves to a location too.
    manualPin: geoPointSchema.optional(),
    addressText: z.string().max(500).optional(),
    // Optional contact for status updates; anonymous by default.
    contact: z.string().max(255).optional(),
    // Optional free-text category hint (e.g. an app picker or SMS keyword).
    // Feeds ONLY the deterministic emergency category check, not the model.
    categoryHint: z.string().max(50).optional(),
    // Client-generated key so retries don't create duplicate reports.
    idempotencyKey: z.string().min(8).max(255),
  })
  .refine((v) => v.location || v.manualPin, {
    message: "location or manualPin is required",
    path: ["location"],
  });

export type ReportSubmission = z.infer<typeof reportSubmissionSchema>;

// Twilio inbound webhook (subset we consume). Twilio posts urlencoded form.
export const twilioInboundSchema = z.object({
  From: z.string(),
  Body: z.string().optional().default(""),
  NumMedia: z.string().optional().default("0"),
  MediaUrl0: z.string().url().optional(),
  Latitude: z.string().optional(),
  Longitude: z.string().optional(),
  MessageSid: z.string(),
});

// Department console: status update (PRD 3.4).
export const statusUpdateSchema = z.object({
  status: z.enum(CASE_STATUSES),
});

// Department console: add a note (internal or public).
export const noteSchema = z.object({
  body: z.string().min(1).max(4000),
  isPublic: z.boolean().default(false),
});

// Department console: resolve a case. Requires EITHER a proof photo OR a
// reason code - never proof-only (PRD 3.4).
export const resolveSchema = z
  .object({
    status: z.enum(["RESOLVED", "WONT_FIX"]).default("RESOLVED"),
    proofPhotoUrl: z.string().url().optional(),
    reasonCode: z.enum(RESOLUTION_REASON_CODES).optional(),
    publicNote: z.string().max(4000).optional(),
  })
  .refine((v) => v.proofPhotoUrl || v.reasonCode, {
    message: "Resolution requires either a proof photo or a reason code",
    path: ["reasonCode"],
  });

// Manual review / moderation queue actions (PRD 3.6).
export const reviewActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve"),
    category: z.enum(CATEGORIES).optional(),
  }),
  z.object({
    action: z.literal("edit_classification"),
    category: z.enum(CATEGORIES),
  }),
  z.object({ action: z.literal("merge"), targetCaseId: z.string().uuid() }),
  z.object({ action: z.literal("reject_spam") }),
  z.object({ action: z.literal("force_emergency") }),
]);

export type ReviewAction = z.infer<typeof reviewActionSchema>;

// Public dashboard list filters (PRD 3.5).
export const publicFilterSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(CASE_STATUSES).optional(),
  jurisdictionId: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(200).default(100),
  offset: z.coerce.number().min(0).default(0),
});
