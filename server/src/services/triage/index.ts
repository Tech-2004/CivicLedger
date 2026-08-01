// Triage pipeline steps (PRD 3.3).
//
// Each step is:
//   - idempotent (safe to retry), and
//   - self-contained: it opens its own 'system' RLS transaction.
//
// The durable workflow (client/workflows/triage.ts) wraps each one in a
// "use step" so the DevKit gives it independent retries plus a DLQ on failure.
// Steps therefore must not assume they share a transaction with each other.
//
// Order: moderate -> classify -> confidence branch -> dedup -> route -> notify.

export { stepModerate, type ModerationStepResult } from "./moderate";
export { stepClassify } from "./classify";
export { stepConfidenceBranch } from "./confidenceBranch";
export { stepDedup, type DedupStepResult } from "./dedup";
export { stepRoute, type RouteStepResult } from "./route";
export { stepNotify } from "./notify";
export { recordWorkflowFailure } from "./failures";
export { loadReport, type ReportRow } from "./reportRow";
