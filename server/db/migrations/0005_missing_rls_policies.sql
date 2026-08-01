-- CivicLedger - policies for tables that had RLS enabled but no policies.
--
-- BUG THIS FIXES
-- On the Supabase database, RLS was enabled on `jurisdictions`, `operators`,
-- `workflow_failures` and `schema_migrations` (0002_rls.sql only ever enabled it
-- on reports/cases/departments/case_notes/report_events). In Postgres, RLS
-- enabled with ZERO policies means deny-all for any role that is not the table
-- owner. The application connects as the non-owner `civic_app`, so those tables
-- read back as empty with no error raised. Consequences:
--
--   operators         -> resolveOperatorByEmail() always returned null, so NO
--                        ONE could sign in to either console, with any provider.
--   jurisdictions     -> ingest could not resolve a default jurisdiction, so
--                        every report was stored with jurisdiction_id = NULL.
--                        stepDedup and stepRoute both bail out when that is
--                        null, so reports were silently never deduplicated or
--                        routed to a department.
--   workflow_failures -> the DLQ insert was denied, so a step that exhausted
--                        its retries lost its failure record.
--
-- Least privilege is preserved: each table is opened only to the contexts that
-- actually need it, rather than being switched back to unrestricted.

-- --- jurisdictions ---------------------------------------------------------
-- Non-sensitive reference data (city name + timezone). Ingest reads it in the
-- 'system' context and the public dashboard filters by it, so allow reads from
-- every context - mirroring the existing cases_public_read policy. Writes stay
-- owner-only (seeded by migration), so no INSERT/UPDATE policy is defined.
ALTER TABLE jurisdictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jurisdictions_read ON jurisdictions;
CREATE POLICY jurisdictions_read ON jurisdictions
  FOR SELECT USING (true);

-- --- operators -------------------------------------------------------------
-- The operator directory maps an email to a role and scope, so it is the root
-- of the authorization model and must not be broadly readable. Only the machine
-- context needs it: resolveOperatorByEmail() runs under withSystem() during
-- sign-in. Deliberately NOT readable by 'public', 'department' or 'reviewer' -
-- that would let one operator enumerate every other operator's email and role.
-- Writes remain owner-only (scripts/add-operator.mjs runs as the owner).
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operators_system_read ON operators;
CREATE POLICY operators_system_read ON operators
  FOR SELECT USING (app_current_role() = 'system');

-- --- workflow_failures (DLQ) ----------------------------------------------
-- Written by the triage workflow in the 'system' context; readable by admins so
-- a replay tool can list what needs attention.
ALTER TABLE workflow_failures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workflow_failures_system_all ON workflow_failures;
CREATE POLICY workflow_failures_system_all ON workflow_failures
  FOR ALL USING (app_current_role() = 'system')
  WITH CHECK (app_current_role() = 'system');

DROP POLICY IF EXISTS workflow_failures_admin_read ON workflow_failures;
CREATE POLICY workflow_failures_admin_read ON workflow_failures
  FOR SELECT USING (app_current_role() = 'admin');

-- --- schema_migrations -----------------------------------------------------
-- Intentionally left with no policy. Only the migration runner touches it and
-- that connects as the owner, which bypasses RLS. The application must never
-- read or write it, so deny-all for civic_app is the correct state.
