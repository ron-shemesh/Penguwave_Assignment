import { useRef, useState } from "react";
import { SEVERITIES, type Severity } from "../types";
import type { UseEventQueryResult } from "../hooks/useEventQuery";

// The filter bar. It writes straight to the URL via the query hook and holds no
// truth of its own — except a debounced local mirror of the search box so
// typing stays smooth without rewriting the URL on every keystroke.
export default function EventFilters({ q }: { q: UseEventQueryResult }) {
  const { query, setSearch, toggleSeverity, setTag, setHost, clear, isFiltered } = q;

  const [searchInput, setSearchInput] = useState(query.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Keep the local box in sync when the URL changes from elsewhere (e.g. Clear,
  // back button, a shared link). This is React's recommended "adjust state while
  // rendering" pattern for mirroring an external value, rather than an effect.
  const [lastQuerySearch, setLastQuerySearch] = useState(query.search);
  if (query.search !== lastQuerySearch) {
    setLastQuerySearch(query.search);
    setSearchInput(query.search);
  }

  const onSearchInput = (value: string) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(value), 250);
  };

  return (
    <div className="filters">
      <input
        type="text"
        className="filters-search"
        placeholder="Search title, description, host, IP, tags…"
        value={searchInput}
        onChange={(e) => onSearchInput(e.target.value)}
        aria-label="Search events"
      />

      <div className="filters-severities" role="group" aria-label="Filter by severity">
        {SEVERITIES.map((s: Severity) => (
          <button
            key={s}
            className={`chip-toggle${query.severities.includes(s) ? " active" : ""}`}
            onClick={() => toggleSeverity(s)}
            aria-pressed={query.severities.includes(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {(query.tag || query.host || isFiltered) && (
        <div className="filters-active">
          {query.host && (
            <span className="active-filter">
              host: {query.host}
              <button onClick={() => setHost("")} aria-label="Clear host filter">
                ✕
              </button>
            </span>
          )}
          {query.tag && (
            <span className="active-filter">
              tag: {query.tag}
              <button onClick={() => setTag("")} aria-label="Clear tag filter">
                ✕
              </button>
            </span>
          )}
          {isFiltered && (
            <button className="clear-all" onClick={clear}>
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
