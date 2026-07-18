// Classification step (PRD 3.3 step 2): vision + text model producing
// category, severity, confidence, and a SECONDARY emergency_flag.
//
// This module defines the provider interface and ships a deterministic stub so
// the pipeline runs end-to-end without external credentials. Wire a real
// vision+text model in `openAiClassifier` (guarded by OPENAI_API_KEY).

import type { Category, Classification, Severity } from "@civicledger/shared";
import { CATEGORIES } from "@civicledger/shared";
import { env } from "../env";

export interface ClassifyInput {
  description?: string | null;
  photoUrl?: string | null;
}

export interface Classifier {
  classify(input: ClassifyInput): Promise<Classification>;
}

// --- keyword heuristics used by the stub ----------------------------------
const KEYWORD_CATEGORY: Array<[RegExp, Category]> = [
  [/pothole|road (crack|damage)|asphalt/i, "pothole"],
  [/street ?light|lamp ?post|light out/i, "streetlight"],
  [/dump(ing)?|trash|garbage|litter|debris/i, "illegal_dumping"],
  [/graffiti|tag(ging)?|vandal/i, "graffiti"],
  [/water|leak|hydrant|main break/i, "water_leak"],
  [/traffic (light|signal)|signal (out|broken)/i, "traffic_signal"],
  [/sidewalk|curb|pavement/i, "sidewalk"],
  [/tree|branch|limb fallen/i, "tree"],
];

function severityFor(text: string): Severity {
  if (/(danger|hazard|urgent|large|deep|blocking|injur)/i.test(text)) {
    return "high";
  }
  if (/(small|minor|cosmetic)/i.test(text)) return "low";
  return "medium";
}

/**
 * Deterministic stub classifier. Confidence is derived from how strongly the
 * text matched + whether a photo was supplied, so the confidence-branch logic
 * (auto / needs_review / manual_review) is exercisable in dev.
 */
export const stubClassifier: Classifier = {
  async classify({ description, photoUrl }): Promise<Classification> {
    const text = (description ?? "").trim();
    let category: Category = "other";
    let matched = false;
    for (const [re, cat] of KEYWORD_CATEGORY) {
      if (re.test(text)) {
        category = cat;
        matched = true;
        break;
      }
    }

    // Confidence: strong text match => high; photo adds a little; no signal
    // at all => deliberately low so it lands in Manual Review.
    let confidence = 0.35;
    if (matched) confidence += 0.4;
    if (photoUrl) confidence += 0.15;
    if (text.length > 40) confidence += 0.05;
    confidence = Math.min(confidence, 0.98);
    if (!matched && !photoUrl && text.length === 0) confidence = 0.2;

    return {
      category: CATEGORIES.includes(category) ? category : "other",
      severity: severityFor(text),
      confidence,
      // Secondary emergency signal only (PRD s2). The stub never sets it true;
      // real models may. The deterministic gate remains the authority.
      emergencyFlag: false,
    };
  },
};

// Placeholder for the real provider. Kept separate so swapping is a one-liner.
const openAiClassifier: Classifier = {
  async classify(input) {
    // TODO: call the vision+text model, map to Classification.
    // Falls back to the stub until implemented.
    return stubClassifier.classify(input);
  },
};

export function getClassifier(): Classifier {
  return env.openaiApiKey ? openAiClassifier : stubClassifier;
}

export function classifyReport(input: ClassifyInput): Promise<Classification> {
  return getClassifier().classify(input);
}
