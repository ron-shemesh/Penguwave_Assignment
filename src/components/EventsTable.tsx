import type { SecurityEvent } from "../types";
import type { SortDirection, SortField } from "../lib/filtering";
import { formatTimestamp, relativeTime } from "../lib/format";
import SeverityBadge from "./SeverityBadge";
import FlagButton from "./FlagButton";

interface Column {
  field: SortField;
  label: string;
}

// Every column is sortable; clicking a header toggles direction via the query
// hook (see useEventQuery.setSort). The active column shows a ▲/▼ indicator.
const COLUMNS: Column[] = [
  { field: "severity", label: "Severity" },
  { field: "title", label: "Title" },
  { field: "assetHostname", label: "Asset" },
  { field: "sourceIp", label: "Source IP" },
  { field: "timestamp", label: "Timestamp" },
];

interface EventsTableProps {
  events: SecurityEvent[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
}

export default function EventsTable({
  events,
  sortField,
  sortDirection,
  onSort,
  onSelect,
  selectedId,
}: EventsTableProps) {
  return (
    <table className="events-table">
      <thead>
        <tr>
          <th className="th-flag" aria-label="Flag" />
          {COLUMNS.map((col) => {
            const active = sortField === col.field;
            return (
              <th key={col.field}>
                <button
                  className={`th-sort${active ? " active" : ""}`}
                  onClick={() => onSort(col.field)}
                  aria-sort={
                    active ? (sortDirection === "asc" ? "ascending" : "descending") : "none"
                  }
                >
                  {col.label}
                  <span className="sort-indicator">
                    {active ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                  </span>
                </button>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {events.map((event) => (
          <tr
            key={event.id}
            className={`event-row${selectedId === event.id ? " selected" : ""}`}
            onClick={() => onSelect(event.id)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(event.id);
              }
            }}
          >
            <td className="cell-flag">
              <FlagButton eventId={event.id} />
            </td>
            <td>
              <SeverityBadge severity={event.severity} />
            </td>
            <td className="cell-title">{event.title}</td>
            <td className="cell-mono">{event.assetHostname || "—"}</td>
            <td className="cell-mono">{event.sourceIp || "—"}</td>
            <td className="cell-time" title={relativeTime(event.timestamp)}>
              {formatTimestamp(event.timestamp)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
