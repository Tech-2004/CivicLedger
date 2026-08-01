// The report projection every triage step works from.
//
// Shared by the step modules so the column list (and the PostGIS/vector casts
// it needs) is written once.

import type { Db } from "../../db";
import type { Category, RoutingPath } from "@civicledger/shared";

export interface ReportRow {
  id: string;
  jurisdiction_id: string | null;
  description: string | null;
  photo_url: string | null;
  address_text: string | null;
  category: Category | null;
  severity: string | null;
  classification_confidence: number | null;
  moderation_status: string;
  routing_path: RoutingPath | null;
  case_id: string | null;
  lat: number;
  lng: number;
  embedding_text: string | null;
}

/**
 * Loads the report a step is operating on.
 *
 * `location` is a geography column and `description_embedding` a pgvector
 * column, so both are projected into plain scalars the JS layer can use.
 */
export async function loadReport(
  db: Db,
  reportId: string,
): Promise<ReportRow> {
  const row = await db.one<ReportRow>(
    `SELECT id, jurisdiction_id, description, photo_url, address_text,
            category, severity, classification_confidence, moderation_status,
            routing_path, case_id,
            ST_Y(location::geometry) AS lat,
            ST_X(location::geometry) AS lng,
            description_embedding::text AS embedding_text
     FROM reports WHERE id = $1`,
    [reportId],
  );
  if (!row) throw new Error(`report ${reportId} not found`);
  return row;
}
