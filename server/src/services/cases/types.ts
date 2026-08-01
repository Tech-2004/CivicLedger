// Shared types for the Department Console services (PRD 3.4).

import type {
  CaseStatus,
  Category,
  ResolutionReasonCode,
  SlaBadge,
} from "@civicledger/shared";

/** A row as returned by the database, before SLA fields are derived. */
export interface CaseRow {
  id: string;
  category: Category;
  status: CaseStatus;
  report_count: number;
  sla_deadline: string | null;
  created_at: string;
  resolved_at: string | null;
  department_id: string | null;
}

/** A case list row with the derived SLA fields the console renders. */
export interface CaseListItem extends CaseRow {
  slaBadge: SlaBadge;
  overdue: boolean;
}

export interface CaseListFilters {
  status?: CaseStatus;
  category?: Category;
  overdue?: boolean;
}

export interface ResolveInput {
  status: "RESOLVED" | "WONT_FIX";
  proofPhotoUrl?: string;
  reasonCode?: ResolutionReasonCode;
  publicNote?: string;
}

/** Uniform result for the console's write actions. */
export interface MutationResult {
  ok: boolean;
  error?: string;
}
