-- CivicLedger Phase 1 - precomputed rollups for the public dashboard.
-- Refreshed hourly (cron) so aggregate endpoints stay p95 < 800ms (PRD SLO).

CREATE MATERIALIZED VIEW IF NOT EXISTS case_rollups AS
SELECT
    c.jurisdiction_id,
    c.category,
    c.status,
    count(*)::int                                             AS case_count,
    sum(c.report_count)::int                                  AS report_count,
    count(*) FILTER (
      WHERE c.status NOT IN ('RESOLVED', 'WONT_FIX')
        AND c.sla_deadline IS NOT NULL
        AND c.sla_deadline < now()
    )::int                                                    AS overdue_count,
    avg(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)))
      FILTER (WHERE c.resolved_at IS NOT NULL)                AS avg_resolution_seconds
FROM cases c
GROUP BY c.jurisdiction_id, c.category, c.status;

CREATE UNIQUE INDEX IF NOT EXISTS case_rollups_key_idx
    ON case_rollups (jurisdiction_id, category, status);

GRANT SELECT ON case_rollups TO civic_app;

-- Refresh helper (called by the hourly cron at /api/cron/refresh-rollups).
CREATE OR REPLACE FUNCTION refresh_case_rollups() RETURNS void
  LANGUAGE plpgsql AS
$$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY case_rollups;
EXCEPTION WHEN feature_not_supported OR object_not_in_prerequisite_state THEN
  -- CONCURRENTLY needs a populated unique index + existing data; fall back.
  REFRESH MATERIALIZED VIEW case_rollups;
END
$$;
