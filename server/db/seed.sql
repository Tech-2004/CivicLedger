-- CivicLedger Phase 1 - minimal seed for local development.
-- Idempotent-ish: safe to re-run on a fresh DB.

INSERT INTO jurisdictions (id, name, timezone)
VALUES ('00000000-0000-0000-0000-000000000001', 'City of Example', 'America/New_York')
ON CONFLICT (id) DO NOTHING;

INSERT INTO departments (id, jurisdiction_id, name, category, contact_method, contact_endpoint, default_sla_hours)
VALUES
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001',
   'Public Works - Roads', 'pothole', 'email', 'roads@example.gov', 72),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000001',
   'Sanitation', 'illegal_dumping', 'email', 'sanitation@example.gov', 120),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000001',
   'Street Lighting', 'streetlight', 'webhook', 'https://example.gov/hooks/lighting', 168),
  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-000000000001',
   'Parks', 'graffiti', 'email', 'parks@example.gov', 240)
ON CONFLICT (jurisdiction_id, category) DO NOTHING;

INSERT INTO operators (email, name, role, jurisdiction_id, department_id)
VALUES
  ('admin@example.gov', 'Ada Admin', 'admin',
   '00000000-0000-0000-0000-000000000001', NULL),
  ('reviewer@example.gov', 'Rey Reviewer', 'reviewer',
   '00000000-0000-0000-0000-000000000001', NULL),
  ('roads@example.gov', 'Dana Dept', 'department',
   '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1')
ON CONFLICT (email) DO NOTHING;
