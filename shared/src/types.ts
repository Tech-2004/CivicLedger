import type {
  CATEGORIES,
  SEVERITIES,
  SOURCE_CHANNELS,
  MODERATION_STATUSES,
  ROUTING_PATHS,
  REPORT_STATUSES,
  CASE_STATUSES,
  RESOLUTION_REASON_CODES,
  OPERATOR_ROLES,
  EVENT_TYPES,
} from "./constants";

export type Category = (typeof CATEGORIES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type SourceChannel = (typeof SOURCE_CHANNELS)[number];
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];
export type RoutingPath = (typeof ROUTING_PATHS)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type CaseStatus = (typeof CASE_STATUSES)[number];
export type ResolutionReasonCode = (typeof RESOLUTION_REASON_CODES)[number];
export type OperatorRole = (typeof OPERATOR_ROLES)[number];
export type EventType = (typeof EVENT_TYPES)[number];

export interface GeoPoint {
  lat: number;
  lng: number;
}

// Result of the deterministic emergency gate (PRD s2) - no model involved.
export interface EmergencyDecision {
  isEmergency: boolean;
  matchedKeyword?: string;
  matchedCategory?: string;
  reason?: string;
}

// Output of the classifier step (PRD 3.3 step 2).
export interface Classification {
  category: Category;
  severity: Severity;
  confidence: number; // 0..1
  emergencyFlag: boolean; // SECONDARY signal only (PRD s2)
}

// Output of the content-safety moderation step (PRD 3.3 step 1).
export interface ModerationResult {
  status: Extract<ModerationStatus, "APPROVED" | "FLAGGED">;
  labels: string[];
}

// SLA badge shown on public + console views (PRD 3.5).
export type SlaBadge = "on_track" | "at_risk" | "overdue" | "resolved";

// Public, PII-free case shape returned by the public API.
export interface PublicCase {
  id: string;
  category: Category;
  status: CaseStatus;
  location: GeoPoint;
  reportCount: number;
  slaBadge: SlaBadge;
  slaDeadline: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

// The identity + scope resolved from an Auth.js session, passed to server
// services so RLS context can be constructed at the DB layer.
export interface OperatorIdentity {
  operatorId: string;
  email: string;
  role: OperatorRole;
  jurisdictionId: string | null;
  departmentId: string | null;
}
