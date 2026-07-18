// Dedup step (PRD 3.3 step 4): PostGIS radius + pgvector embedding similarity
// against OPEN cases. If a match is found, the incoming report merges as a
// duplicate onto the existing case.

import type { Db } from "../db";
import type { Category, GeoPoint } from "@civicledger/shared";
import { env } from "../env";

export interface DedupCandidate {
  caseId: string;
  distanceMeters: number;
  cosineDistance: number | null;
}

export interface DedupInput {
  location: GeoPoint;
  category: Category;
  jurisdictionId: string;
  // pgvector literal (e.g. "[0.1,0.2,...]") read back from the report row, or
  // null when the report has no embedding.
  embeddingLiteral?: string | null;
  // Exclude the incoming report itself from the candidate scan.
  excludeReportId?: string;
}

/**
 * Finds the nearest OPEN case that plausibly represents the same issue:
 *   - same jurisdiction + category
 *   - within DEDUP_RADIUS_METERS (PostGIS ST_DWithin on geography)
 *   - if both sides have embeddings, cosine distance under threshold (pgvector)
 * Returns the best candidate case or null.
 */
export async function findDuplicateCase(
  db: Db,
  input: DedupInput,
): Promise<DedupCandidate | null> {
  const { location, category, jurisdictionId, embeddingLiteral } = input;
  const vecLiteral = embeddingLiteral ?? null;
  const excludeReportId = input.excludeReportId ?? null;

  const rows = await db.query<{
    case_id: string;
    dist_m: number;
    cos_dist: number | null;
  }>(
    `
    SELECT r.case_id,
           ST_Distance(
             r.location,
             ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
           ) AS dist_m,
           CASE
             WHEN $3::vector IS NOT NULL AND r.description_embedding IS NOT NULL
             THEN r.description_embedding <=> $3::vector
             ELSE NULL
           END AS cos_dist
    FROM reports r
    JOIN cases c ON c.id = r.case_id
    WHERE r.case_id IS NOT NULL
      AND ($8::uuid IS NULL OR r.id <> $8::uuid)
      AND c.jurisdiction_id = $4
      AND c.category = $5
      AND c.status IN ('OPEN', 'IN_PROGRESS')
      AND ST_DWithin(
            r.location,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            $6
          )
      AND (
            $3::vector IS NULL
            OR r.description_embedding IS NULL
            OR (r.description_embedding <=> $3::vector) < $7
          )
    ORDER BY dist_m ASC
    LIMIT 1
    `,
    [
      location.lng,
      location.lat,
      vecLiteral,
      jurisdictionId,
      category,
      env.dedupRadiusMeters,
      env.dedupCosineThreshold,
      excludeReportId,
    ],
  );

  const row = rows[0];
  if (!row) return null;
  return {
    caseId: row.case_id,
    distanceMeters: Number(row.dist_m),
    cosineDistance: row.cos_dist === null ? null : Number(row.cos_dist),
  };
}
