// Manual Review + Moderation Queue (PRD 3.6). One console, two entry paths:
//   - low-confidence classification (routing_path = 'manual_review', HELD)
//   - flagged content            (moderation_status = 'FLAGGED')
// Actions: approve / edit classification, merge, reject spam, force emergency.
//
// Reviewer + admin only. Reads/writes go through the RLS 'reviewer'/'admin'
// context; the pipeline-continuation steps run in the system context.

import { withRls, withSystem } from "../db";
import { appendEvent } from "../domain/audit";
import {
  stepClassify,
  stepDedup,
  stepRoute,
  stepNotify,
} from "./triage";
import type {
  Category,
  OperatorIdentity,
  ReviewAction,
} from "@civicledger/shared";

function ctxOf(identity: OperatorIdentity) {
  return {
    role: identity.role as "reviewer" | "admin",
    jurisdictionId: identity.jurisdictionId,
    departmentId: identity.departmentId,
  } as const;
}

export interface ReviewQueueItem {
  id: string;
  entry_reason: "low_confidence" | "flagged_content";
  category: Category | null;
  severity: string | null;
  classification_confidence: number | null;
  moderation_status: string;
  routing_path: string | null;
  status: string;
  description: string | null;
  photo_url: string | null;
  emergency_gate_fired: boolean;
  created_at: string;
}

export async function listReviewQueue(
  identity: OperatorIdentity,
): Promise<ReviewQueueItem[]> {
  return withRls(ctxOf(identity), (db) =>
    db.query<ReviewQueueItem>(
      `SELECT id,
              CASE WHEN moderation_status = 'FLAGGED' THEN 'flagged_content'
                   ELSE 'low_confidence' END AS entry_reason,
              category, severity, classification_confidence, moderation_status,
              routing_path, status, description, photo_url,
              emergency_gate_fired, created_at
       FROM reports
       WHERE (routing_path = 'manual_review' OR moderation_status = 'FLAGGED')
         AND status NOT IN ('REJECTED', 'MERGED', 'ROUTED')
       ORDER BY emergency_gate_fired DESC, created_at ASC
       LIMIT 500`,
    ),
  );
}

/** Ensures the report is classified, then dedups and routes if not a dup. */
async function continuePipeline(reportId: string): Promise<void> {
  const current = await withSystem((db) =>
    db.one<{ category: Category | null }>(
      `SELECT category FROM reports WHERE id = $1`,
      [reportId],
    ),
  );
  if (!current?.category) {
    await stepClassify(reportId);
  }
  const dedup = await stepDedup(reportId);
  if (!dedup.merged) {
    await stepRoute(reportId);
  }
  await stepNotify(reportId);
}

export async function applyReviewAction(
  identity: OperatorIdentity,
  reportId: string,
  action: ReviewAction,
): Promise<{ ok: boolean; error?: string }> {
  // Record the human action in the RLS-scoped context first (audit + writes
  // the reviewer is authorized for).
  await withRls(ctxOf(identity), async (db) => {
    switch (action.action) {
      case "approve":
        await db.query(
          `UPDATE reports
           SET moderation_status = 'APPROVED',
               routing_path = 'needs_review'
           WHERE id = $1`,
          [reportId],
        );
        if (action.category) {
          await db.query(`UPDATE reports SET category = $2 WHERE id = $1`, [
            reportId,
            action.category,
          ]);
        }
        break;
      case "edit_classification":
        await db.query(
          `UPDATE reports
           SET category = $2, moderation_status = 'APPROVED',
               routing_path = 'needs_review'
           WHERE id = $1`,
          [reportId, action.category],
        );
        break;
      case "merge":
        await db.query(
          `UPDATE reports SET case_id = $2, status = 'MERGED' WHERE id = $1`,
          [reportId, action.targetCaseId],
        );
        await db.query(
          `UPDATE cases SET report_count = report_count + 1 WHERE id = $1`,
          [action.targetCaseId],
        );
        break;
      case "reject_spam":
        await db.query(
          `UPDATE reports SET status = 'REJECTED' WHERE id = $1`,
          [reportId],
        );
        break;
      case "force_emergency":
        await db.query(
          `UPDATE reports SET emergency_gate_fired = true WHERE id = $1`,
          [reportId],
        );
        break;
    }

    await appendEvent(db, {
      reportId,
      eventType: "REVIEW_ACTION",
      payload: { ...action },
      actor: identity.operatorId,
    });
  });

  // Approve / edit re-enter the automated pipeline (dedup + route).
  if (action.action === "approve" || action.action === "edit_classification") {
    await continuePipeline(reportId);
  }

  return { ok: true };
}
