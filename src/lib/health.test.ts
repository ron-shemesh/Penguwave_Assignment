import { describe, it, expect } from "vitest";
import { computeHealth } from "./health";
import type { SecurityEvent, Severity } from "../types";

function events(...severities: Severity[]): SecurityEvent[] {
  return severities.map((severity, i) => ({
    id: `evt-${i}`,
    timestamp: "2025-02-18T14:32:01Z",
    severity,
    title: "e",
    description: "",
    assetHostname: "h",
    assetIp: "1.1.1.1",
    sourceIp: "2.2.2.2",
    tags: [],
  }));
}

describe("computeHealth", () => {
  it("reports full integrity and SECURE for no events", () => {
    const h = computeHealth([]);
    expect(h.integrity).toBe(100);
    expect(h.concern).toBe(0);
    expect(h.level).toBe("SECURE");
    expect(h.total).toBe(0);
  });

  it("stays healthy for a handful of low-severity events", () => {
    const h = computeHealth(events("LOW", "LOW", "LOW"));
    expect(h.integrity).toBeGreaterThan(90);
    expect(h.level).toBe("SECURE");
  });

  it("forces CRITICAL level whenever any critical event is present", () => {
    // Even a lone critical among quiet noise must read CRITICAL ("boss on screen").
    const h = computeHealth(events("CRITICAL", "LOW", "LOW"));
    expect(h.level).toBe("CRITICAL");
  });

  it("forces at least ELEVATED when a HIGH is present (no criticals)", () => {
    const h = computeHealth(events("HIGH"));
    expect(["ELEVATED", "HIGH", "CRITICAL"]).toContain(h.level);
    expect(h.level).not.toBe("SECURE");
    expect(h.level).not.toBe("GUARDED");
  });

  it("drains integrity as threat volume rises", () => {
    const few = computeHealth(events("HIGH", "MEDIUM"));
    const many = computeHealth(events(...Array<Severity>(20).fill("HIGH")));
    expect(many.integrity).toBeLessThan(few.integrity);
  });

  it("keeps integrity within 0–100 and concern = 100 − integrity bounds", () => {
    const h = computeHealth(events(...Array<Severity>(50).fill("CRITICAL")));
    expect(h.integrity).toBeGreaterThanOrEqual(0);
    expect(h.integrity).toBeLessThanOrEqual(100);
    expect(h.level).toBe("CRITICAL");
  });
});
