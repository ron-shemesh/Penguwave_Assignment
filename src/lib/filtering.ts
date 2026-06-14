import type { SecurityEvent, Severity } from "../types";
import { SEVERITY_RANK } from "./constants";
import { timestampSortKey } from "./format";

export type SortField = "severity" | "timestamp" | "title" | "assetHostname" | "sourceIp";
export type SortDirection = "asc" | "desc";

export interface EventQuery {
  search: string;
  severities: Severity[]; // empty = all severities
  tag: string; // "" = any tag
  host: string; // "" = any host
  sortField: SortField;
  sortDirection: SortDirection;
}

export const DEFAULT_QUERY: EventQuery = {
  search: "",
  severities: [],
  tag: "",
  host: "",
  sortField: "timestamp",
  sortDirection: "desc",
};

function matchesSearch(event: SecurityEvent, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    event.title,
    event.description,
    event.assetHostname,
    event.assetIp,
    event.sourceIp,
    ...event.tags,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function filterEvents(events: SecurityEvent[], query: EventQuery): SecurityEvent[] {
  return events.filter((event) => {
    if (!matchesSearch(event, query.search)) return false;
    if (query.severities.length > 0 && !query.severities.includes(event.severity)) return false;
    if (query.tag && !event.tags.includes(query.tag)) return false;
    if (query.host && event.assetHostname !== query.host) return false;
    return true;
  });
}

function compare(a: SecurityEvent, b: SecurityEvent, field: SortField): number {
  switch (field) {
    case "severity":
      return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    case "timestamp":
      return timestampSortKey(a.timestamp) - timestampSortKey(b.timestamp);
    default:
      return a[field].localeCompare(b[field]);
  }
}

export function sortEvents(events: SecurityEvent[], query: EventQuery): SecurityEvent[] {
  const factor = query.sortDirection === "asc" ? 1 : -1;
  // Copy first — never mutate the caller's array.
  return [...events].sort((a, b) => compare(a, b, query.sortField) * factor);
}

export function applyQuery(events: SecurityEvent[], query: EventQuery): SecurityEvent[] {
  return sortEvents(filterEvents(events, query), query);
}

export interface FacetCount {
  value: string;
  count: number;
}

/** Top N values for a facet across the given events, most frequent first. */
function topFacet(values: string[], limit: number): FacetCount[] {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface EventSummary {
  total: number;
  bySeverity: Record<Severity, number>;
  topHosts: FacetCount[];
  topTags: FacetCount[];
}

export function summarize(events: SecurityEvent[]): EventSummary {
  const bySeverity: Record<Severity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    UNKNOWN: 0,
  };
  for (const e of events) bySeverity[e.severity] += 1;
  return {
    total: events.length,
    bySeverity,
    topHosts: topFacet(events.map((e) => e.assetHostname), 5),
    topTags: topFacet(events.flatMap((e) => e.tags), 8),
  };
}
