import { describe, it, expect } from "vitest";
import { detectEmergency } from "../src/domain/emergency";

// The deterministic emergency gate is a liability-critical, model-free check
// (PRD s2). These tests lock its behavior independent of any AI output.
describe("detectEmergency", () => {
  it("fires on an emergency keyword in the description", () => {
    const d = detectEmergency("There is a gas leak near the school");
    expect(d.isEmergency).toBe(true);
    expect(d.matchedKeyword).toBe("gas leak");
  });

  it("is case-insensitive and tolerant of extra whitespace", () => {
    const d = detectEmergency("DOWNED   POWER   LINE across the road");
    expect(d.isEmergency).toBe(true);
    expect(d.matchedKeyword).toBe("downed power line");
  });

  it("fires on an emergency category hint regardless of text", () => {
    const d = detectEmergency("", "gas_leak");
    expect(d.isEmergency).toBe(true);
    expect(d.matchedCategory).toBe("gas_leak");
  });

  it("does not fire on ordinary, non-emergency reports", () => {
    expect(detectEmergency("large pothole on 5th street").isEmergency).toBe(false);
    expect(detectEmergency("graffiti on the underpass").isEmergency).toBe(false);
    expect(detectEmergency(null).isEmergency).toBe(false);
    expect(detectEmergency(undefined).isEmergency).toBe(false);
  });
});
