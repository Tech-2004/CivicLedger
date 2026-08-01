// Department Console services (PRD 3.4).
//
// Every function runs inside an RLS-scoped transaction derived from the operator
// identity, so the Postgres policies - not just these queries - enforce the
// department/jurisdiction boundary.

export { listCases } from "./list";
export { getCaseDetail } from "./detail";
export { updateCaseStatus, addCaseNote } from "./mutations";
export { resolveCase } from "./resolve";
export type {
  CaseListFilters,
  CaseListItem,
  CaseRow,
  MutationResult,
  ResolveInput,
} from "./types";
