import type { SecurityEvent } from "../types";
import { formatTimestamp } from "./format";

// RFC 4180-ish CSV escaping: wrap a field in quotes if it contains a comma,
// quote, or newline, and double any embedded quotes. The starter's naive
// join(",") corrupted any value containing those characters (descriptions and
// tag lists routinely do).
function escapeCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// Explicit, ordered columns so the export is stable and readable regardless of
// object key order. Arrays (tags) are joined with a separator inside one cell.
const COLUMNS: { header: string; value: (e: SecurityEvent) => string }[] = [
  { header: "id", value: (e) => e.id },
  { header: "timestamp", value: (e) => e.timestamp },
  { header: "timestamp_local", value: (e) => formatTimestamp(e.timestamp) },
  { header: "severity", value: (e) => e.severity },
  { header: "title", value: (e) => e.title },
  { header: "description", value: (e) => e.description },
  { header: "assetHostname", value: (e) => e.assetHostname },
  { header: "assetIp", value: (e) => e.assetIp },
  { header: "sourceIp", value: (e) => e.sourceIp },
  { header: "tags", value: (e) => e.tags.join("; ") },
];

export function eventsToCsv(events: SecurityEvent[]): string {
  const header = COLUMNS.map((c) => escapeCell(c.header)).join(",");
  const rows = events.map((e) => COLUMNS.map((c) => escapeCell(c.value(e))).join(","));
  return [header, ...rows].join("\r\n");
}

export function eventsToJson(events: SecurityEvent[]): string {
  return JSON.stringify(events, null, 2);
}
