// Content-safety moderation step (PRD 3.3 step 1).
//
// Flagged photos are NEVER public: they go straight to the moderation queue.
// This module defines the provider interface + a permissive stub. Wire a real
// image-safety provider in `providerModerate` (guarded by OPENAI_API_KEY).

import type { ModerationResult } from "@civicledger/shared";
import { env } from "../env";

export interface ModerateInput {
  photoUrl?: string | null;
  description?: string | null;
}

export interface Moderator {
  moderate(input: ModerateInput): Promise<ModerationResult>;
}

// Stub: approves everything (no external call). Real provider must actually
// scan the image + text and FLAG unsafe content.
export const stubModerator: Moderator = {
  async moderate(): Promise<ModerationResult> {
    return { status: "APPROVED", labels: [] };
  },
};

const providerModerator: Moderator = {
  async moderate(input) {
    // TODO: call an image/text safety API; return FLAGGED + labels on hits.
    return stubModerator.moderate(input);
  },
};

export function getModerator(): Moderator {
  return env.openaiApiKey ? providerModerator : stubModerator;
}

export function moderateReport(input: ModerateInput): Promise<ModerationResult> {
  return getModerator().moderate(input);
}
