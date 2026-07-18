// Async triage workflow (PRD 3.3). Durable orchestration via the Workflow
// DevKit: each step is independently retryable; a step that exhausts its
// retries is recorded to the DLQ (workflow_failures) for manual replay.
//
// The "use step" functions are thin, durable wrappers around the actual logic
// in @civicledger/server (services/triage.ts). Steps run with full Node access;
// the "use workflow" orchestrator stays pure control-flow.

import {
  stepModerate,
  stepClassify,
  stepConfidenceBranch,
  stepDedup,
  stepRoute,
  stepNotify,
  recordWorkflowFailure,
} from "@civicledger/server";

// --- durable steps ---------------------------------------------------------
async function moderateStep(reportId: string) {
  "use step";
  return stepModerate(reportId);
}

async function classifyStep(reportId: string) {
  "use step";
  return stepClassify(reportId);
}

async function confidenceBranchStep(reportId: string, confidence: number) {
  "use step";
  return stepConfidenceBranch(reportId, confidence);
}

async function dedupStep(reportId: string) {
  "use step";
  return stepDedup(reportId);
}

async function routeStep(reportId: string) {
  "use step";
  return stepRoute(reportId);
}

async function notifyStep(reportId: string) {
  "use step";
  return stepNotify(reportId);
}

async function recordFailureStep(reportId: string, step: string, error: string) {
  "use step";
  return recordWorkflowFailure(reportId, step, error);
}

export interface TriageOutcome {
  reportId: string;
  outcome: "flagged" | "manual_review" | "merged" | "routed";
  caseId?: string | null;
}

// --- orchestrator ----------------------------------------------------------
export async function triageWorkflow(reportId: string): Promise<TriageOutcome> {
  "use workflow";

  // 1. Moderate. Flagged content never continues to the public pipeline; it
  //    diverts to the moderation queue (stepModerate sets HELD/manual_review).
  let mod;
  try {
    mod = await moderateStep(reportId);
  } catch (err) {
    await recordFailureStep(reportId, "moderate", String(err));
    throw err;
  }
  if (mod.flagged) {
    await notifyStep(reportId);
    return { reportId, outcome: "flagged" };
  }

  // 2. Classify (also embeds for dedup).
  let classification;
  try {
    classification = await classifyStep(reportId);
  } catch (err) {
    await recordFailureStep(reportId, "classify", String(err));
    throw err;
  }

  // 3. Confidence branch (HARD branch, PRD 3.3 step 3).
  let path;
  try {
    path = await confidenceBranchStep(reportId, classification.confidence);
  } catch (err) {
    await recordFailureStep(reportId, "confidence_branch", String(err));
    throw err;
  }
  if (path === "manual_review") {
    // Below T_review: hold in Manual Review Queue, skip auto dedup + route.
    await notifyStep(reportId);
    return { reportId, outcome: "manual_review" };
  }

  // 4. Dedup (auto + needs_review paths only).
  let dedup;
  try {
    dedup = await dedupStep(reportId);
  } catch (err) {
    await recordFailureStep(reportId, "dedup", String(err));
    throw err;
  }
  if (dedup.merged) {
    await notifyStep(reportId);
    return { reportId, outcome: "merged", caseId: dedup.caseId };
  }

  // 5. Route: create a case + dispatch to the owning department.
  let routed;
  try {
    routed = await routeStep(reportId);
  } catch (err) {
    await recordFailureStep(reportId, "route", String(err));
    throw err;
  }

  // 6. Notify citizen (SLA timer opened at case creation).
  try {
    await notifyStep(reportId);
  } catch (err) {
    await recordFailureStep(reportId, "notify", String(err));
    throw err;
  }

  return { reportId, outcome: "routed", caseId: routed.caseId };
}
