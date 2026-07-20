-- CivicLedger Phase 1 - Row Level Security
--
-- Model: the application connects as a NON-owner role (civic_app) that is
-- subject to RLS. Migrations/seed run as the table owner (bypasses RLS).
-- Every request opens a transaction and sets, via SET LOCAL:
--   app.current_role            -> 'system' | 'department' | 'reviewer' | 'admin' | 'public'
--   app.current_jurisdiction_id -> uuid (operator scope)
--   app.current_department_id   -> uuid (department operator scope)
-- See src/lib/db.ts (withRls / withSystem / withPublic).

-- --- app role -------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'civic_app') THEN
    CREATE ROLE civic_app LOGIN PASSWORD '${CIVIC_APP_PASSWORD}';
  ELSE
    ALTER ROLE civic_app WITH PASSWORD '${CIVIC_APP_PASSWORD}';
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO civic_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO civic_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO civic_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO civic_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO civic_app;

-- --- session helpers ------------------------------------------------------
CREATE OR REPLACE FUNCTION app_current_role() RETURNS text
  LANGUAGE sql STABLE AS
$$ SELECT coalesce(nullif(current_setting('app.current_role', true), ''), 'public') $$;

CREATE OR REPLACE FUNCTION app_jurisdiction() RETURNS uuid
  LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('app.current_jurisdiction_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION app_department() RETURNS uuid
  LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('app.current_department_id', true), '')::uuid $$;

-- --- enable RLS -----------------------------------------------------------
ALTER TABLE reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases          ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_notes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_events  ENABLE ROW LEVEL SECURITY;

-- --- CASES ----------------------------------------------------------------
-- Public may read all cases (public data, no PII on this table).
DROP POLICY IF EXISTS cases_public_read ON cases;
CREATE POLICY cases_public_read ON cases
  FOR SELECT USING (true);

-- system (ingest + triage workflow) has full access.
DROP POLICY IF EXISTS cases_system_all ON cases;
CREATE POLICY cases_system_all ON cases
  FOR ALL USING (app_current_role() = 'system')
  WITH CHECK (app_current_role() = 'system');

-- operators may modify only cases in their jurisdiction (admins: any).
DROP POLICY IF EXISTS cases_operator_write ON cases;
CREATE POLICY cases_operator_write ON cases
  FOR UPDATE
  USING (app_current_role() = 'admin' OR jurisdiction_id = app_jurisdiction())
  WITH CHECK (app_current_role() = 'admin' OR jurisdiction_id = app_jurisdiction());

-- --- REPORTS --------------------------------------------------------------
-- Reports carry PII (contact). No blanket public read.
DROP POLICY IF EXISTS reports_system_all ON reports;
CREATE POLICY reports_system_all ON reports
  FOR ALL USING (app_current_role() = 'system')
  WITH CHECK (app_current_role() = 'system');

-- operators (department/reviewer/admin) read reports in their jurisdiction.
DROP POLICY IF EXISTS reports_operator_read ON reports;
CREATE POLICY reports_operator_read ON reports
  FOR SELECT USING (
    app_current_role() IN ('admin', 'reviewer')
    OR (app_current_role() = 'department' AND jurisdiction_id = app_jurisdiction())
  );

DROP POLICY IF EXISTS reports_operator_write ON reports;
CREATE POLICY reports_operator_write ON reports
  FOR UPDATE USING (
    app_current_role() IN ('admin', 'reviewer')
    OR (app_current_role() = 'department' AND jurisdiction_id = app_jurisdiction())
  );

-- --- DEPARTMENTS ----------------------------------------------------------
DROP POLICY IF EXISTS departments_read ON departments;
CREATE POLICY departments_read ON departments
  FOR SELECT USING (
    app_current_role() IN ('system', 'admin', 'reviewer')
    OR jurisdiction_id = app_jurisdiction()
  );

-- --- CASE NOTES -----------------------------------------------------------
-- Public reads only public notes.
DROP POLICY IF EXISTS case_notes_public_read ON case_notes;
CREATE POLICY case_notes_public_read ON case_notes
  FOR SELECT USING (
    is_public = true
    OR app_current_role() IN ('system', 'admin', 'reviewer')
    OR EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = case_notes.case_id
        AND c.jurisdiction_id = app_jurisdiction()
    )
  );

DROP POLICY IF EXISTS case_notes_operator_write ON case_notes;
CREATE POLICY case_notes_operator_write ON case_notes
  FOR INSERT WITH CHECK (
    app_current_role() IN ('admin', 'reviewer')
    OR EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = case_notes.case_id
        AND c.jurisdiction_id = app_jurisdiction()
    )
  );

-- --- REPORT EVENTS (append-only audit) ------------------------------------
-- Insert allowed for system + operators; reads for operators/admin/reviewer.
DROP POLICY IF EXISTS report_events_insert ON report_events;
CREATE POLICY report_events_insert ON report_events
  FOR INSERT WITH CHECK (app_current_role() <> 'public');

DROP POLICY IF EXISTS report_events_read ON report_events;
CREATE POLICY report_events_read ON report_events
  FOR SELECT USING (app_current_role() IN ('system', 'admin', 'reviewer', 'department'));

-- ---------------------------------------------------------------------------
-- Public-safe view: case detail without any PII, only moderation-approved media.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public_case_media AS
  SELECT r.case_id, r.id AS report_id, r.photo_url, r.created_at
  FROM reports r
  WHERE r.moderation_status = 'APPROVED'
    AND r.photo_url IS NOT NULL
    AND r.case_id IS NOT NULL;

GRANT SELECT ON public_case_media TO civic_app;
