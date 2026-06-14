import { describe, it, expect } from "vitest";
import { categorizeEvent, summarizeByCategory, eventsByDay } from "./categories";
import type { SecurityEvent } from "../types";

function makeEvent(overrides: Partial<SecurityEvent> = {}): SecurityEvent {
  return {
    id: "evt-1",
    timestamp: "2025-02-18T14:32:01Z",
    severity: "MEDIUM",
    title: "Event",
    description: "",
    assetHostname: "host",
    assetIp: "10.0.0.1",
    sourceIp: "10.0.0.2",
    tags: [],
    ...overrides,
  };
}

describe("categorizeEvent", () => {
  it("maps a tag to its category", () => {
    expect(categorizeEvent(makeEvent({ tags: ["firewall"] }))).toBe("Network");
    expect(categorizeEvent(makeEvent({ tags: ["ransomware"] }))).toBe("Endpoint");
    expect(categorizeEvent(makeEvent({ tags: ["exfiltration"] }))).toBe("Data");
  });

  it("falls back to Other when no tag matches", () => {
    expect(categorizeEvent(makeEvent({ tags: ["totally-unknown-tag"] }))).toBe("Other");
    expect(categorizeEvent(makeEvent({ tags: [] }))).toBe("Other");
  });

  it("prefers the higher-priority (more security-relevant) category when tags span several", () => {
    // 'routine' (Operational) + 'brute-force' (Identity & Access) → Identity wins,
    // so a noteworthy event is never buried under a routine tag.
    expect(categorizeEvent(makeEvent({ tags: ["routine", "brute-force"] }))).toBe(
      "Identity & Access",
    );
  });

  it("is case-insensitive on tags", () => {
    expect(categorizeEvent(makeEvent({ tags: ["FIREWALL"] }))).toBe("Network");
  });
});

describe("summarizeByCategory", () => {
  it("counts events per category and sums to the total", () => {
    const events = [
      makeEvent({ tags: ["firewall"] }),
      makeEvent({ tags: ["ssh"] }),
      makeEvent({ tags: ["ransomware"] }),
      makeEvent({ tags: ["routine"] }),
    ];
    const result = summarizeByCategory(events);
    const total = result.reduce((sum, c) => sum + c.count, 0);
    expect(total).toBe(4);
    expect(result.find((c) => c.category === "Network")?.count).toBe(2);
  });

  it("drops categories with zero events and keeps CATEGORIES ordering", () => {
    const result = summarizeByCategory([makeEvent({ tags: ["ransomware"] })]);
    expect(result).toEqual([{ category: "Endpoint", count: 1 }]);
  });
});

describe("eventsByDay", () => {
  it("buckets events by calendar day, chronologically", () => {
    const events = [
      makeEvent({ timestamp: "2025-02-12T10:00:00Z" }),
      makeEvent({ timestamp: "2025-02-10T10:00:00Z" }),
      makeEvent({ timestamp: "2025-02-10T23:00:00Z" }),
    ];
    expect(eventsByDay(events)).toEqual([
      { day: "2025-02-10", count: 2 },
      { day: "2025-02-12", count: 1 },
    ]);
  });

  it("groups missing/invalid timestamps under 'Unknown', sorted last", () => {
    const events = [
      makeEvent({ timestamp: "garbage" }),
      makeEvent({ timestamp: "2025-02-10T10:00:00Z" }),
      makeEvent({ timestamp: "" }),
    ];
    const result = eventsByDay(events);
    expect(result[0]).toEqual({ day: "2025-02-10", count: 1 });
    expect(result[result.length - 1]).toEqual({ day: "Unknown", count: 2 });
  });
});
