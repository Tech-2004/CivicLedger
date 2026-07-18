import { describe, it, expect } from "vitest";
import { computeSlaDeadline, slaBadge } from "../src/domain/sla";

describe("computeSlaDeadline", () => {
  it("adds the SLA window in hours", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    const deadline = computeSlaDeadline(72, from);
    expect(deadline.toISOString()).toBe("2026-01-04T00:00:00.000Z");
  });
});

describe("slaBadge", () => {
  const created = new Date("2026-01-01T00:00:00Z");
  const deadline = new Date("2026-01-05T00:00:00Z"); // 96h window

  it("returns resolved for terminal statuses", () => {
    expect(slaBadge("RESOLVED", deadline, created)).toBe("resolved");
    expect(slaBadge("WONT_FIX", deadline, created)).toBe("resolved");
  });

  it("returns overdue once past the deadline", () => {
    const now = new Date("2026-01-06T00:00:00Z");
    expect(slaBadge("OPEN", deadline, created, now)).toBe("overdue");
  });

  it("returns at_risk in the final 25% of the window", () => {
    const now = new Date("2026-01-04T18:00:00Z"); // 6h left of 96h (<25%)
    expect(slaBadge("IN_PROGRESS", deadline, created, now)).toBe("at_risk");
  });

  it("returns on_track early in the window", () => {
    const now = new Date("2026-01-02T00:00:00Z");
    expect(slaBadge("OPEN", deadline, created, now)).toBe("on_track");
  });

  it("returns on_track when no deadline is set", () => {
    expect(slaBadge("OPEN", null, created)).toBe("on_track");
  });
});
