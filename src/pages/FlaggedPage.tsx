import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "../hooks/useEvents";
import { useFlags } from "../hooks/useFlags";
import { sortEvents, DEFAULT_QUERY, type SortDirection, type SortField } from "../lib/filtering";
import EventsTable from "../components/EventsTable";
import ExportButtons from "../components/ExportButtons";
import HealthBar from "../components/HealthBar";

// The analyst's personal worklist: the events they flagged for follow-up.
// Reuses the events service, table, export, and health bar so it behaves exactly
// like the main workspace — just scoped to flagged ids, with its own sort state.
export default function FlaggedPage() {
  const { status, events, error, reload } = useEvents();
  const { flagged } = useFlags();
  const navigate = useNavigate();

  const [sortField, setSortField] = useState<SortField>(DEFAULT_QUERY.sortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(DEFAULT_QUERY.sortDirection);

  const onSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "severity" || field === "timestamp" ? "desc" : "asc");
    }
  };

  const flaggedEvents = useMemo(
    () => sortEvents(events.filter((e) => flagged.has(e.id)), { ...DEFAULT_QUERY, sortField, sortDirection }),
    [events, flagged, sortField, sortDirection],
  );

  if (status === "loading") {
    return (
      <div className="page-container">
        <h1>Flagged Events</h1>
        <div className="state-panel" role="status" aria-live="polite">
          <div className="spinner" />
          <p>Loading events…</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="page-container">
        <h1>Flagged Events</h1>
        <div className="state-panel state-error" role="alert">
          <p>{error}</p>
          <button className="btn-primary" onClick={reload}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="events-header">
        <h1>Flagged Events ({flaggedEvents.length})</h1>
        <ExportButtons events={flaggedEvents} />
      </div>

      {flaggedEvents.length === 0 ? (
        <div className="state-panel">
          <p>No flagged events yet.</p>
          <p style={{ color: "#93a3b8", marginTop: 8 }}>
            Use the ⚐ flag next to any event on the <strong>Events</strong> tab to add it to your
            follow-up list.
          </p>
        </div>
      ) : (
        <>
          <HealthBar events={flaggedEvents} />
          <EventsTable
            events={flaggedEvents}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
            onSelect={(id) => navigate(`/events/${encodeURIComponent(id)}`)}
            selectedId={null}
          />
        </>
      )}
    </div>
  );
}
