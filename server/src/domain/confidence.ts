// Confidence branch (PRD 3.3 step 3). HARD branch, not a soft warning.
//
//   confidence >= T_route              -> "auto"          (auto-continue)
//   T_review <= confidence < T_route   -> "needs_review"  (route + flag)
//   confidence <  T_review             -> "manual_review" (hold; skip auto
//                                                           dedup + auto route)
import type { RoutingPath } from "@civicledger/shared";
import { env } from "../env";

export interface ConfidenceDecision {
  path: RoutingPath;
  tRoute: number;
  tReview: number;
  confidence: number;
}

export function decideConfidenceBranch(confidence: number): ConfidenceDecision {
  const tRoute = env.tRoute;
  const tReview = env.tReview;

  let path: RoutingPath;
  if (confidence >= tRoute) {
    path = "auto";
  } else if (confidence >= tReview) {
    path = "needs_review";
  } else {
    path = "manual_review";
  }

  return { path, tRoute, tReview, confidence };
}
