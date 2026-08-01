-- CivicLedger - fix the rollup refresh so the application role can run it.
--
-- BUG THIS FIXES
-- 0003 created refresh_case_rollups() as SECURITY INVOKER (the default), so it
-- executed with the privileges of the caller. The app connects as civic_app,
-- which is deliberately NOT the owner of case_rollups, and
-- REFRESH MATERIALIZED VIEW requires ownership. Every cron run therefore failed
-- with:
--     permission denied for materialized view case_rollups
-- silently leaving the public dashboard aggregates stale forever.
--
-- FIX
-- Recreate the function as SECURITY DEFINER so it runs as the function owner
-- (the migration role, which owns case_rollups).
--
-- search_path is pinned: a SECURITY DEFINER function that inherits the caller's
-- search_path is a privilege-escalation vector (the caller could shadow an
-- unqualified object name and have it execute as the owner).
--
-- NOTE ON `CONCURRENTLY`
-- REFRESH MATERIALIZED VIEW CONCURRENTLY cannot run inside a transaction block,
-- and a PL/pgSQL function body is always in one. That raises SQLSTATE 0A000
-- (feature_not_supported), which the handler below catches to fall back to a
-- plain refresh. The plain refresh takes an ACCESS EXCLUSIVE lock, so dashboard
-- reads block for its duration. That is acceptable for a once-daily refresh of
-- a small aggregate; revisit if the dataset or refresh frequency grows.

CREATE OR REPLACE FUNCTION refresh_case_rollups() RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
AS
$$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY case_rollups;
EXCEPTION WHEN feature_not_supported OR object_not_in_prerequisite_state THEN
  -- CONCURRENTLY needs a populated unique index and cannot run inside a
  -- transaction/function; fall back to a blocking refresh.
  REFRESH MATERIALIZED VIEW case_rollups;
END
$$;

-- SECURITY DEFINER functions are granted to PUBLIC by default. Lock it down to
-- the application role only.
REVOKE ALL ON FUNCTION refresh_case_rollups() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_case_rollups() TO civic_app;
