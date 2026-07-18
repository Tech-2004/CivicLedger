-- CivicLedger Phase 1 - core schema
-- Reordered vs the PRD so foreign keys resolve (cases before reports).

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------------
-- Jurisdictions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Departments (route target for a (jurisdiction, category) pair)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_id UUID REFERENCES jurisdictions(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    contact_method VARCHAR(20) NOT NULL, -- 'api', 'email', 'webhook'
    contact_endpoint TEXT NOT NULL,
    escalation_contact TEXT,
    default_sla_hours INT DEFAULT 168
);

CREATE UNIQUE INDEX IF NOT EXISTS departments_jurisdiction_category_idx
    ON departments (jurisdiction_id, category);

-- ---------------------------------------------------------------------------
-- Cases (one open case per real-world issue; reports merge into it)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_id UUID REFERENCES jurisdictions(id) NOT NULL,
    category VARCHAR(50) NOT NULL,
    department_id UUID REFERENCES departments(id),
    primary_location GEOGRAPHY(POINT, 4326) NOT NULL,
    report_count INT DEFAULT 1,
    status VARCHAR(30) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, WONT_FIX, OVERDUE
    sla_deadline TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_photo_url TEXT,
    resolution_reason_code VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cases_location_idx ON cases USING GIST (primary_location);
CREATE INDEX IF NOT EXISTS cases_open_lookup_idx
    ON cases (jurisdiction_id, category, status);

-- ---------------------------------------------------------------------------
-- Reports (raw citizen submissions; thin row written in request path)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID,
    source_channel VARCHAR(20) NOT NULL DEFAULT 'app', -- 'app' or 'sms'
    idempotency_key VARCHAR(255),
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address_text TEXT,
    photo_url TEXT,
    moderation_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, FLAGGED
    description TEXT,
    description_embedding VECTOR(1536),
    category VARCHAR(50),
    severity VARCHAR(20),
    emergency_flag BOOLEAN DEFAULT FALSE, -- classifier secondary signal, NOT the gate
    emergency_gate_fired BOOLEAN DEFAULT FALSE, -- deterministic pre-AI gate (PRD s2)
    classification_confidence FLOAT,
    routing_path VARCHAR(20), -- 'auto', 'needs_review', 'manual_review'
    status VARCHAR(30) DEFAULT 'PENDING',
    contact TEXT, -- optional; for status updates. Never exposed on public views.
    case_id UUID REFERENCES cases(id),
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reports_embedding_hnsw_idx
    ON reports USING hnsw (description_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS reports_location_idx ON reports USING GIST (location);
CREATE UNIQUE INDEX IF NOT EXISTS reports_idempotency_key_idx
    ON reports (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS reports_moderation_idx ON reports (moderation_status);
CREATE INDEX IF NOT EXISTS reports_routing_path_idx ON reports (routing_path);

-- ---------------------------------------------------------------------------
-- Append-only audit / event log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_events (
    id BIGSERIAL PRIMARY KEY,
    report_id UUID REFERENCES reports(id),
    case_id UUID REFERENCES cases(id),
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    actor VARCHAR(100), -- 'system' or a user id
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS report_events_report_idx ON report_events (report_id);
CREATE INDEX IF NOT EXISTS report_events_case_idx ON report_events (case_id);

-- ---------------------------------------------------------------------------
-- Dead-letter queue for triage steps that exhaust retries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id),
    step VARCHAR(50) NOT NULL,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    replayed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS workflow_failures_open_idx
    ON workflow_failures (created_at) WHERE replayed_at IS NULL;

-- ---------------------------------------------------------------------------
-- Console operators (department + review staff). Auth.js stores the identity;
-- this table maps a user to a jurisdiction/department + role for RBAC + RLS.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(30) NOT NULL DEFAULT 'department', -- 'department', 'reviewer', 'admin'
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    department_id UUID REFERENCES departments(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Case notes (internal + optional public update notes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) NOT NULL,
    author_id UUID,
    body TEXT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS case_notes_case_idx ON case_notes (case_id);
