import { describe, it, expect } from "vitest";
import { decideConfidenceBranch } from "../src/domain/confidence";

// Confidence branch is a HARD branch (PRD 3.3 step 3). Defaults: T_route 0.8,
// T_review 0.5. These tests pin the three-way split + boundary behavior.
describe("decideConfidenceBranch", () => {
  it("auto-continues at or above T_route", () => {
    expect(decideConfidenceBranch(0.95).path).toBe("auto");
    expect(decideConfidenceBranch(0.8).path).toBe("auto"); // boundary inclusive
  });

  it("routes with needs_review between T_review and T_route", () => {
    expect(decideConfidenceBranch(0.79).path).toBe("needs_review");
    expect(decideConfidenceBranch(0.5).path).toBe("needs_review"); // boundary inclusive
  });

  it("holds for manual review below T_review", () => {
    expect(decideConfidenceBranch(0.49).path).toBe("manual_review");
    expect(decideConfidenceBranch(0).path).toBe("manual_review");
  });
});
