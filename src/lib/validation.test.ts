import { describe, it, expect } from "vitest";
import { normalizeEvent, normalizeEvents } from "./validation";

describe("normalizeEvent", () => {
  it("passes a well-formed record through unchanged", () => {
    const raw = {
      id: "evt-1",
      timestamp: "2025-02-18T14:32:01Z",
      severity: "HIGH",
      title: "Title",
      description: "Desc",
      assetHostname: "host",
      assetIp: "1.1.1.1",
      sourceIp: "2.2.2.2",
      tags: ["a"],
      userId: "usr-1",
    };
    expect(normalizeEvent(raw, 0)).toEqual(raw);
  });

  it("coerces an unknown severity to UNKNOWN rather than dropping the record", () => {
    expect(normalizeEvent({ severity: "BOGUS" }, 0).severity).toBe("UNKNOWN");
  });

  it("uppercases a known severity given in lowercase", () => {
    expect(normalizeEvent({ severity: "critical" }, 0).severity).toBe("CRITICAL");
  });

  it("synthesizes a stable id when one is missing", () => {
    expect(normalizeEvent({}, 7).id).toBe("unknown-7");
  });

  it("defaults a missing title to a placeholder", () => {
    expect(normalizeEvent({}, 0).title).toBe("(untitled event)");
  });

  it("turns a non-array tags field into an empty array", () => {
    expect(normalizeEvent({ tags: "not-an-array" }, 0).tags).toEqual([]);
    expect(normalizeEvent({ tags: undefined }, 0).tags).toEqual([]);
  });

  it("drops non-string entries inside the tags array", () => {
    expect(normalizeEvent({ tags: ["ok", 5, null, "fine"] }, 0).tags).toEqual(["ok", "fine"]);
  });

  it("keeps userId only when it is a string", () => {
    expect(normalizeEvent({ userId: "usr-1" }, 0).userId).toBe("usr-1");
    expect(normalizeEvent({ userId: 42 }, 0).userId).toBeUndefined();
  });

  it("never throws on null/garbage input", () => {
    expect(() => normalizeEvent(null, 0)).not.toThrow();
    expect(() => normalizeEvent("string", 0)).not.toThrow();
  });
});

describe("normalizeEvents", () => {
  it("returns an empty array when the input is not an array", () => {
    expect(normalizeEvents(null)).toEqual([]);
    expect(normalizeEvents({})).toEqual([]);
  });

  it("normalizes every record in an array", () => {
    const out = normalizeEvents([{ severity: "x" }, { severity: "LOW" }]);
    expect(out).toHaveLength(2);
    expect(out[0].severity).toBe("UNKNOWN");
    expect(out[1].severity).toBe("LOW");
  });
});
