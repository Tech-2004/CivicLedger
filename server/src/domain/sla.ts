// SLA computation + badge (PRD 3.4 opens SLA timer, 3.5 shows badge).

import type { CaseStatus, SlaBadge } from "@civicledger/shared";

/** Deadline = now + department default SLA hours. */
export function computeSlaDeadline(
  slaHours: number,
  from: Date = new Date(),
): Date {
  return new Date(from.getTime() + slaHours * 3600 * 1000);
}

/**
 * Maps a case to an SLA badge:
 *   resolved  -> terminal states
 *   overdue   -> past deadline and still open
 *   at_risk   -> within the final 25% of the SLA window
 *   on_track  -> otherwise
 */
export function slaBadge(
  status: CaseStatus,
  slaDeadline: Date | string | null,
  createdAt: Date | string,
  now: Date = new Date(),
): SlaBadge {
  if (status === "RESOLVED" || status === "WONT_FIX") return "resolved";
  if (!slaDeadline) return "on_track";

  const deadline =
    slaDeadline instanceof Date ? slaDeadline : new Date(slaDeadline);
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);

  if (now.getTime() > deadline.getTime()) return "overdue";

  const total = deadline.getTime() - created.getTime();
  const remaining = deadline.getTime() - now.getTime();
  if (total > 0 && remaining / total <= 0.25) return "at_risk";

  return "on_track";
}
