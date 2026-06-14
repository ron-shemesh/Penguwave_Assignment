import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SEVERITIES, type Severity } from "../types";
import {
  DEFAULT_QUERY,
  type EventQuery,
  type SortDirection,
  type SortField,
} from "../lib/filtering";

// Single source of truth for the workspace view = the URL. This makes any view
// shareable, refresh-safe, and back-button friendly. Junk params are ignored
// and fall back to defaults (a real "messy input" path), so a hand-edited or
// stale URL can never crash the page.

const VALID_SEVERITIES = new Set<string>(SEVERITIES);
const VALID_SORT_FIELDS = new Set<SortField>([
  "severity",
  "timestamp",
  "title",
  "assetHostname",
  "sourceIp",
]);

function parseSeverities(raw: string | null): Severity[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => VALID_SEVERITIES.has(s)) as Severity[];
}

function parseSortField(raw: string | null): SortField {
  return raw && VALID_SORT_FIELDS.has(raw as SortField)
    ? (raw as SortField)
    : DEFAULT_QUERY.sortField;
}

function parseSortDirection(raw: string | null): SortDirection {
  return raw === "asc" || raw === "desc" ? raw : DEFAULT_QUERY.sortDirection;
}

export interface UseEventQueryResult {
  query: EventQuery;
  setSearch: (value: string) => void;
  setSeverities: (severities: Severity[]) => void;
  toggleSeverity: (severity: Severity) => void;
  setTag: (tag: string) => void;
  setHost: (host: string) => void;
  setSort: (field: SortField) => void;
  clear: () => void;
  isFiltered: boolean;
}

export function useEventQuery(): UseEventQueryResult {
  const [params, setParams] = useSearchParams();

  const query: EventQuery = useMemo(
    () => ({
      search: params.get("q") ?? "",
      severities: parseSeverities(params.get("severity")),
      tag: params.get("tag") ?? "",
      host: params.get("host") ?? "",
      sortField: parseSortField(params.get("sort")),
      sortDirection: parseSortDirection(params.get("dir")),
    }),
    [params],
  );

  // Update params from the current query, dropping keys at their default so URLs
  // stay clean. Uses the functional form to avoid races between rapid updates.
  const update = useCallback(
    (mutate: (q: EventQuery) => EventQuery) => {
      setParams(
        (prev) => {
          const current: EventQuery = {
            search: prev.get("q") ?? "",
            severities: parseSeverities(prev.get("severity")),
            tag: prev.get("tag") ?? "",
            host: prev.get("host") ?? "",
            sortField: parseSortField(prev.get("sort")),
            sortDirection: parseSortDirection(prev.get("dir")),
          };
          const next = mutate(current);
          const out = new URLSearchParams();
          if (next.search) out.set("q", next.search);
          if (next.severities.length) out.set("severity", next.severities.join(","));
          if (next.tag) out.set("tag", next.tag);
          if (next.host) out.set("host", next.host);
          if (next.sortField !== DEFAULT_QUERY.sortField) out.set("sort", next.sortField);
          if (next.sortDirection !== DEFAULT_QUERY.sortDirection) out.set("dir", next.sortDirection);
          return out;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setSearch = useCallback((value: string) => update((q) => ({ ...q, search: value })), [update]);

  const setSeverities = useCallback(
    (severities: Severity[]) => update((q) => ({ ...q, severities })),
    [update],
  );

  const toggleSeverity = useCallback(
    (severity: Severity) =>
      update((q) => ({
        ...q,
        severities: q.severities.includes(severity)
          ? q.severities.filter((s) => s !== severity)
          : [...q.severities, severity],
      })),
    [update],
  );

  const setTag = useCallback((tag: string) => update((q) => ({ ...q, tag })), [update]);
  const setHost = useCallback((host: string) => update((q) => ({ ...q, host })), [update]);

  // Clicking a sort field toggles direction if already active, else applies a
  // sensible default direction (desc for severity/timestamp, asc for text).
  const setSort = useCallback(
    (field: SortField) =>
      update((q) => {
        if (q.sortField === field) {
          return { ...q, sortDirection: q.sortDirection === "asc" ? "desc" : "asc" };
        }
        const defaultDir: SortDirection =
          field === "severity" || field === "timestamp" ? "desc" : "asc";
        return { ...q, sortField: field, sortDirection: defaultDir };
      }),
    [update],
  );

  const clear = useCallback(() => update(() => ({ ...DEFAULT_QUERY })), [update]);

  const isFiltered =
    query.search !== "" ||
    query.severities.length > 0 ||
    query.tag !== "" ||
    query.host !== "";

  return { query, setSearch, setSeverities, toggleSeverity, setTag, setHost, setSort, clear, isFiltered };
}
