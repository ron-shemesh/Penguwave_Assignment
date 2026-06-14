import { SEVERITIES, type Severity, type SecurityEvent } from "../types";

// Normalize a single raw record (from the API / mock JSON, where anything can be
// missing or the wrong type) into a safe SecurityEvent. The dashboard renders
// many records, so the rule is: never throw, never drop — coerce and keep, so a
// malformed event is still visible to the analyst rather than silently lost.

const KNOWN_SEVERITIES = new Set<string>(SEVERITIES);

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function asSeverity(value: unknown): Severity {
  if (typeof value === "string" && KNOWN_SEVERITIES.has(value.toUpperCase())) {
    return value.toUpperCase() as Severity;
  }
  return "UNKNOWN";
}

export function normalizeEvent(raw: unknown, index: number): SecurityEvent {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    // A record with no id still needs a stable React key.
    id: asString(r.id) || `unknown-${index}`,
    timestamp: asString(r.timestamp),
    severity: asSeverity(r.severity),
    title: asString(r.title, "(untitled event)"),
    description: asString(r.description),
    assetHostname: asString(r.assetHostname),
    assetIp: asString(r.assetIp),
    sourceIp: asString(r.sourceIp),
    tags: asStringArray(r.tags),
    userId: typeof r.userId === "string" ? r.userId : undefined,
  };
}

export function normalizeEvents(raw: unknown): SecurityEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => normalizeEvent(item, i));
}
