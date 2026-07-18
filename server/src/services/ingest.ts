// Thin ingestion gateway logic (PRD 3.2). Does ONLY:
//   1. deterministic emergency check (pre-AI, model-free)
//   2. validate + idempotency (validation is at the route via zod)
//   3. write a minimal reports row, status PENDING
// It does NOT call models, dedup, or route - that's the async workflow.
// Enqueueing the workflow happens in the route handler (client app) so the
// dependency direction stays client -> server.

import { withSystem } from "../db";
import { env } from "../env";
import { detectEmergency } from "../domain/emergency";
import { appendEvent } from "../domain/audit";
import type { EmergencyDecision, GeoPoint, SourceChannel } from "@civicledger/shared";

export interface IngestInput {
  sourceChannel: SourceChannel;
  description?: string | null;
  photoUrl?: string | null;
  location: GeoPoint;
  addressText?: string | null;
  contact?: string | null;
  idempotencyKey: string;
  // Optional pre-tag (e.g. app category picker / SMS keyword) - feeds the
  // deterministic emergency category check only, never the classifier.
  categoryHint?: string | null;
}

export interface IngestResult {
  reportId: string;
  isEmergency: boolean;
  emergency: EmergencyDecision;
  trackingUrl: string;
  emergencyNumber: string;
  duplicateOfSubmission: boolean; // true if idempotency key already existed
}

/**
 * Phase 1 jurisdiction assignment. Geo-fenced routing is Phase 2 (PRD scope),
 * so we assign the earliest-created jurisdiction as the default tenant. Swap
 * this for a PostGIS point-in-polygon lookup when boundaries land.
 */
async function resolveDefaultJurisdiction(
  db: import("../db").Db,
): Promise<string | null> {
  const row = await db.one<{ id: string }>(
    `SELECT id FROM jurisdictions ORDER BY created_at ASC LIMIT 1`,
  );
  return row?.id ?? null;
}

export async function createReport(input: IngestInput): Promise<IngestResult> {
  // (1) Deterministic emergency gate - runs before anything else, no model.
  const emergency = detectEmergency(input.description, input.categoryHint);

  const trackingBase = env.appUrl.replace(/\/$/, "");

  const result = await withSystem(async (db) => {
    // (2) Idempotency: return the existing report if this key was seen.
    const existing = await db.one<{ id: string }>(
      `SELECT id FROM reports WHERE idempotency_key = $1 LIMIT 1`,
      [input.idempotencyKey],
    );
    if (existing) {
      return { reportId: existing.id, duplicate: true };
    }

    const jurisdictionId = await resolveDefaultJurisdiction(db);

    // (3) Minimal row, status PENDING. No embedding/category/severity yet -
    // those are produced by the async workflow.
    const inserted = await db.one<{ id: string }>(
      `INSERT INTO reports (
         source_channel, idempotency_key, jurisdiction_id, location,
         address_text, photo_url, description, contact,
         moderation_status, status, emergency_gate_fired
       ) VALUES (
         $1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography,
         $6, $7, $8, $9,
         'PENDING', 'PENDING', $10
       )
       RETURNING id`,
      [
        input.sourceChannel,
        input.idempotencyKey,
        jurisdictionId,
        input.location.lng,
        input.location.lat,
        input.addressText ?? null,
        input.photoUrl ?? null,
        input.description ?? null,
        input.contact ?? null,
        emergency.isEmergency,
      ],
    );

    const reportId = inserted!.id;

    await appendEvent(db, {
      reportId,
      eventType: "REPORT_RECEIVED",
      payload: {
        sourceChannel: input.sourceChannel,
        hasPhoto: Boolean(input.photoUrl),
      },
    });

    if (emergency.isEmergency) {
      await appendEvent(db, {
        reportId,
        eventType: "EMERGENCY_GATE_FIRED",
        payload: { ...emergency },
      });
    }

    return { reportId, duplicate: false };
  });

  return {
    reportId: result.reportId,
    isEmergency: emergency.isEmergency,
    emergency,
    trackingUrl: `${trackingBase}/track/${result.reportId}`,
    emergencyNumber: env.emergencyNumber,
    duplicateOfSubmission: result.duplicate,
  };
}

/** Public status lookup for the citizen tracking page (no PII beyond status). */
export async function getReportStatus(reportId: string) {
  return withSystem((db) =>
    db.one<{
      id: string;
      status: string;
      moderation_status: string;
      routing_path: string | null;
      case_id: string | null;
      case_status: string | null;
      created_at: string;
    }>(
      `SELECT r.id, r.status, r.moderation_status, r.routing_path,
              r.case_id, c.status AS case_status, r.created_at
       FROM reports r
       LEFT JOIN cases c ON c.id = r.case_id
       WHERE r.id = $1`,
      [reportId],
    ),
  );
}
