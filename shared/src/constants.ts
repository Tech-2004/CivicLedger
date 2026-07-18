// Enumerations shared by client + server. Categories are jurisdiction-
// configurable at runtime; these are the Phase 1 defaults.

export const CATEGORIES = [
  "pothole",
  "streetlight",
  "illegal_dumping",
  "graffiti",
  "water_leak",
  "traffic_signal",
  "sidewalk",
  "tree",
  "other",
] as const;

export const SEVERITIES = ["low", "medium", "high", "critical"] as const;

export const SOURCE_CHANNELS = ["app", "sms"] as const;

export const MODERATION_STATUSES = ["PENDING", "APPROVED", "FLAGGED"] as const;

export const ROUTING_PATHS = ["auto", "needs_review", "manual_review"] as const;

export const REPORT_STATUSES = [
  "PENDING",
  "TRIAGING",
  "ROUTED",
  "MERGED",
  "HELD",
  "REJECTED",
] as const;

export const CASE_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "WONT_FIX",
  "OVERDUE",
] as const;

// A resolution needs EITHER a proof photo OR one of these reason codes
// (PRD 3.4) - never proof-only.
export const RESOLUTION_REASON_CODES = [
  "third_party_utility",
  "not_in_jurisdiction",
  "duplicate",
  "no_action_needed",
  "insufficient_info",
  "completed_no_photo",
] as const;

// Operator roles for RBAC + RLS scoping.
export const OPERATOR_ROLES = ["department", "reviewer", "admin"] as const;

// Audit event types written to report_events (PRD 3.3 step 7).
export const EVENT_TYPES = [
  "REPORT_RECEIVED",
  "EMERGENCY_GATE_FIRED",
  "MODERATED",
  "CLASSIFIED",
  "CONFIDENCE_BRANCH",
  "DEDUP_MERGED",
  "CASE_CREATED",
  "ROUTED",
  "NOTIFIED",
  "STATUS_CHANGED",
  "NOTE_ADDED",
  "RESOLVED",
  "REVIEW_ACTION",
  "WORKFLOW_FAILURE",
] as const;
