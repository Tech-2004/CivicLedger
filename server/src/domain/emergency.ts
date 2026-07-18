// Deterministic emergency detection (PRD Section 2).
//
// HARD RULE. This runs as a pure keyword + category match BEFORE any AI call,
// on every submission regardless of channel. If it fires, the citizen is shown
// local emergency contact info instead of the report queue - no model judgment
// is involved. The classifier's own `emergency_flag` is a SEPARATE, secondary
// signal used only for triage prioritization; it never gates this.
//
// Keep this list conservative and auditable. A model missing a real emergency
// is a liability, so this must be simple, reviewable, and independent of the AI.

import type { EmergencyDecision } from "@civicledger/shared";

// Whole-word / phrase keywords that indicate a life-safety situation.
const EMERGENCY_KEYWORDS: string[] = [
  "gas leak",
  "smell gas",
  "smell of gas",
  "fire",
  "explosion",
  "gunshot",
  "gun shot",
  "shooting",
  "downed power line",
  "power line down",
  "live wire",
  "electrical wire down",
  "sinkhole",
  "building collapse",
  "collapsed",
  "person trapped",
  "trapped",
  "unconscious",
  "not breathing",
  "flooding home",
  "water rescue",
  "sewage in home",
  "chemical spill",
  "hazmat",
  "gas main",
  "carbon monoxide",
];

// Categories that are always treated as emergencies at intake.
const EMERGENCY_CATEGORIES: string[] = ["gas_leak", "downed_power_line"];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Pure, synchronous, model-free emergency check.
 * @param description free-text from the citizen (may be empty)
 * @param category   optional pre-tagged category (e.g. an SMS keyword or app pick)
 */
export function detectEmergency(
  description: string | null | undefined,
  category?: string | null,
): EmergencyDecision {
  if (category && EMERGENCY_CATEGORIES.includes(category)) {
    return {
      isEmergency: true,
      matchedCategory: category,
      reason: `category "${category}" is classified as an emergency at intake`,
    };
  }

  const text = normalize(description ?? "");
  if (text.length > 0) {
    for (const keyword of EMERGENCY_KEYWORDS) {
      if (text.includes(keyword)) {
        return {
          isEmergency: true,
          matchedKeyword: keyword,
          reason: `matched emergency keyword "${keyword}"`,
        };
      }
    }
  }

  return { isEmergency: false };
}

// Exported for tests / review-console display.
export const EMERGENCY_RULESET = {
  keywords: EMERGENCY_KEYWORDS,
  categories: EMERGENCY_CATEGORIES,
};
