import { describe, it, expect } from "vitest";
import {
  applyQuery,
  filterEvents,
  sortEvents,
  summarize,
  DEFAULT_QUERY,
  type EventQuery,
} from "./filtering";
import type { SecurityEvent } from "../types";

function makeEvent(overrides: Partial<SecurityEvent> = {}): SecurityEvent {
  return {
    id: "evt-1",
    timestamp: "2025-02-18T14:32:01Z",
    severity: "MEDIUM",
    title: "Suspicious login",
    description: "A description",
    assetHostname: "host-1",
    assetIp: "10.0.0.1",
    sourceIp: "10.0.0.2",
    tags: ["auth"],
    ...overrides,
  };
}

const query = (overrides: Partial<EventQuery> = {}): EventQuery => ({
  ...DEFAULT_QUERY,
  ...overrides,
});

describe("filterEvents", () => {
  const events = [
    makeEvent({ id: "a", title: "Malware on host", severity: "HIGH", tags: ["endpoint"], assetHostname: "h1" }),
    makeEvent({ id: "b", title: "Benign event", severity: "LOW", tags: ["network"], assetHostname: "h2" }),
    makeEvent({ id: "c", description: "phishing email", severity: "CRITICAL", tags: ["email"], assetHostname: "h1" }),
  ];

  it("returns everything for an empty query", () => {
    expect(filterEvents(events, query())).toHaveLength(3);
  });

  it("matches search against title, description and tags, case-insensitively", () => {
    expect(filterEvents(events, query({ search: "MALWARE" })).map((e) => e.id)).toEqual(["a"]);
    expect(filterEvents(events, query({ search: "phishing" })).map((e) => e.id)).toEqual(["c"]);
    expect(filterEvents(events, query({ search: "network" })).map((e) => e.id)).toEqual(["b"]);
  });

  it("filters by a multi-select of severities", () => {
    const out = filterEvents(events, query({ severities: ["HIGH", "CRITICAL"] }));
    expect(out.map((e) => e.id).sort()).toEqual(["a", "c"]);
  });

  it("filters by tag and by host", () => {
    expect(filterEvents(events, query({ tag: "email" })).map((e) => e.id)).toEqual(["c"]);
    expect(filterEvents(events, query({ host: "h1" })).map((e) => e.id).sort()).toEqual(["a", "c"]);
  });

  it("combines filters with AND semantics", () => {
    const out = filterEvents(events, query({ host: "h1", severities: ["HIGH"] }));
    expect(out.map((e) => e.id)).toEqual(["a"]);
  });
});

describe("sortEvents", () => {
  const events = [
    makeEvent({ id: "low", severity: "LOW" }),
    makeEvent({ id: "crit", severity: "CRITICAL" }),
    makeEvent({ id: "med", severity: "MEDIUM" }),
  ];

  it("sorts by severity rank descending (CRITICAL first)", () => {
    const out = sortEvents(events, query({ sortField: "severity", sortDirection: "desc" }));
    expect(out.map((e) => e.id)).toEqual(["crit", "med", "low"]);
  });

  it("reverses for ascending direction", () => {
    const out = sortEvents(events, query({ sortField: "severity", sortDirection: "asc" }));
    expect(out.map((e) => e.id)).toEqual(["low", "med", "crit"]);
  });

  it("sorts by timestamp, putting invalid timestamps last when descending", () => {
    const evs = [
      makeEvent({ id: "bad", timestamp: "garbage" }),
      makeEvent({ id: "old", timestamp: "2025-01-01T00:00:00Z" }),
      makeEvent({ id: "new", timestamp: "2025-06-01T00:00:00Z" }),
    ];
    const out = sortEvents(evs, query({ sortField: "timestamp", sortDirection: "desc" }));
    expect(out.map((e) => e.id)).toEqual(["new", "old", "bad"]);
  });

  it("does not mutate the input array", () => {
    const input = [...events];
    sortEvents(input, query({ sortField: "severity" }));
    expect(input.map((e) => e.id)).toEqual(["low", "crit", "med"]);
  });
});

describe("applyQuery", () => {
  it("filters then sorts", () => {
    const events = [
      makeEvent({ id: "a", severity: "LOW", title: "keep me" }),
      makeEvent({ id: "b", severity: "CRITICAL", title: "keep me" }),
      makeEvent({ id: "c", severity: "HIGH", title: "drop" }),
    ];
    const out = applyQuery(events, query({ search: "keep", sortField: "severity", sortDirection: "desc" }));
    expect(out.map((e) => e.id)).toEqual(["b", "a"]);
  });
});

describe("summarize", () => {
  it("counts totals and severities, including CRITICAL and UNKNOWN", () => {
    const events = [
      makeEvent({ severity: "CRITICAL" }),
      makeEvent({ severity: "CRITICAL" }),
      makeEvent({ severity: "LOW" }),
      makeEvent({ severity: "UNKNOWN" }),
    ];
    const s = summarize(events);
    expect(s.total).toBe(4);
    expect(s.bySeverity.CRITICAL).toBe(2);
    expect(s.bySeverity.LOW).toBe(1);
    expect(s.bySeverity.UNKNOWN).toBe(1);
    expect(s.bySeverity.HIGH).toBe(0);
  });

  it("ranks top hosts and tags by frequency", () => {
    const events = [
      makeEvent({ assetHostname: "h1", tags: ["x", "y"] }),
      makeEvent({ assetHostname: "h1", tags: ["x"] }),
      makeEvent({ assetHostname: "h2", tags: ["x"] }),
    ];
    const s = summarize(events);
    expect(s.topHosts[0]).toEqual({ value: "h1", count: 2 });
    expect(s.topTags[0]).toEqual({ value: "x", count: 3 });
  });

  it("ignores empty host/tag values in facets", () => {
    const events = [makeEvent({ assetHostname: "", tags: ["", "real"] })];
    const s = summarize(events);
    expect(s.topHosts).toHaveLength(0);
    expect(s.topTags).toEqual([{ value: "real", count: 1 }]);
  });
});
