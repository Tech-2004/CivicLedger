// SLA computation + badge (PRD 3.4 opens SLA timer, 3.5 shows badge).

import type { CaseStatus, SlaBadge } from "@civicledger/shared";

/** Deadline = now + department default SLA hours. */
export function computeSlaDeadline(
  slaHours: number,
  from: Date = new Date(),
): Date {
  return new Date(from.getTime() + slaHours * 3600 * 1000);
}

/** Statuses that stop the SLA clock. */
export const TERMINAL_CASE_STATUSES = [
  "RESOLVED",
  "WONT_FIX",
] as const satisfies readonly CaseStatus[];

export function isTerminalStatus(status: CaseStatus): boolean {
  return (TERMINAL_CASE_STATUSES as readonly CaseStatus[]).includes(status);
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Whether a case has breached its SLA.
 *
 * Mirrors the SQL predicate in db/migrations/0003_rollups.sql
 * (`status NOT IN ('RESOLVED','WONT_FIX') AND sla_deadline < now()`) - keep the
 * two definitions in sync so the dashboard tiles and the list views agree.
 */
export function isOverdue(
  status: CaseStatus,
  slaDeadline: Date | string | null,
  now: Date = new Date(),
): boolean {
  if (isTerminalStatus(status)) return false;
  if (!slaDeadline) return false;
  return now.getTime() > toDate(slaDeadline).getTime();
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
  if (isTerminalStatus(status)) return "resolved";
  if (!slaDeadline) return "on_track";

  const deadline = toDate(slaDeadline);
  const created = toDate(createdAt);

  if (now.getTime() > deadline.getTime()) return "overdue";

  const total = deadline.getTime() - created.getTime();
  const remaining = deadline.getTime() - now.getTime();
  if (total > 0 && remaining / total <= 0.25) return "at_risk";

  return "on_track";
}
