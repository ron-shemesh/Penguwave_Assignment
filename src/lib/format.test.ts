import { describe, it, expect } from "vitest";
import { formatTimestamp, timestampSortKey } from "./format";

describe("formatTimestamp", () => {
  it("formats a valid ISO timestamp to a non-empty string", () => {
    const out = formatTimestamp("2025-02-18T14:32:01Z");
    expect(out).not.toBe("—");
    expect(out.length).toBeGreaterThan(0);
  });

  it("returns the placeholder for an empty timestamp", () => {
    expect(formatTimestamp("")).toBe("—");
  });

  it("returns the placeholder for an unparseable timestamp instead of 'Invalid Date'", () => {
    expect(formatTimestamp("not a date")).toBe("—");
  });
});

describe("timestampSortKey", () => {
  it("orders valid timestamps chronologically", () => {
    const earlier = timestampSortKey("2025-01-01T00:00:00Z");
    const later = timestampSortKey("2025-12-31T00:00:00Z");
    expect(earlier).toBeLessThan(later);
  });

  it("sorts invalid/missing timestamps last (ascending), via -Infinity", () => {
    expect(timestampSortKey("")).toBe(-Infinity);
    expect(timestampSortKey("garbage")).toBe(-Infinity);
  });
});
