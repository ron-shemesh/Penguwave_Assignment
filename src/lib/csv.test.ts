import { describe, it, expect } from "vitest";
import { eventsToCsv, eventsToJson } from "./csv";
import type { SecurityEvent } from "../types";

function makeEvent(overrides: Partial<SecurityEvent> = {}): SecurityEvent {
  return {
    id: "evt-1",
    timestamp: "2025-02-18T14:32:01Z",
    severity: "HIGH",
    title: "Test event",
    description: "A description",
    assetHostname: "host-1",
    assetIp: "10.0.0.1",
    sourceIp: "10.0.0.2",
    tags: ["a", "b"],
    ...overrides,
  };
}

describe("eventsToCsv", () => {
  it("emits a header row plus one row per event", () => {
    const csv = eventsToCsv([makeEvent(), makeEvent({ id: "evt-2" })]);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(3); // header + 2 rows
    expect(lines[0]).toContain("id");
    expect(lines[0]).toContain("severity");
  });

  it("quotes and escapes fields containing commas, quotes, and newlines", () => {
    const csv = eventsToCsv([
      makeEvent({ description: 'has, comma "quote" and\nnewline' }),
    ]);
    // Embedded quotes are doubled and the whole cell is wrapped in quotes.
    expect(csv).toContain('"has, comma ""quote"" and\nnewline"');
  });

  it("does not quote plain values", () => {
    const csv = eventsToCsv([makeEvent({ title: "plain" })]);
    expect(csv).toContain(",plain,");
  });

  it("joins array fields (tags) into a single cell", () => {
    const csv = eventsToCsv([makeEvent({ tags: ["x", "y", "z"] })]);
    expect(csv).toContain("x; y; z");
  });

  it("renders an empty timestamp safely", () => {
    const csv = eventsToCsv([makeEvent({ timestamp: "" })]);
    // timestamp_local column should be the placeholder, never "Invalid Date".
    expect(csv).not.toContain("Invalid Date");
  });
});

describe("eventsToJson", () => {
  it("produces valid, round-trippable JSON", () => {
    const events = [makeEvent()];
    const parsed = JSON.parse(eventsToJson(events));
    expect(parsed).toEqual(events);
  });
});
