import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEvents } from "../hooks/useEvents";
import { useEventQuery } from "../hooks/useEventQuery";
import { applyQuery, summarize } from "../lib/filtering";
import HealthBar from "../components/HealthBar";
import SummaryStrip from "../components/SummaryStrip";
import OverviewCharts from "../components/OverviewCharts";
import EventFilters from "../components/EventFilters";
import EventsTable from "../components/EventsTable";
import ExportButtons from "../components/ExportButtons";
import EventDetailDrawer from "../components/EventDetailDrawer";

// The single analyst workspace. It owns the wiring only: data comes from
// useEvents (loading/error/ready), the view (search/filter/sort/selection) lives
// in the URL via useEventQuery + the :id route param, and every child reads the
// same derived list — so the summary counts, the table, and the export always
// agree by construction.
export default function EventsPage() {
  const { status, events, error, reload } = useEvents();
  const q = useEventQuery();
  const { id: selectedId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Derived (filtered + sorted) list — this is "what you see is what you export".
  const visible = useMemo(() => applyQuery(events, q.query), [events, q.query]);
  const summary = useMemo(() => summarize(visible), [visible]);

  // Selection lives in the URL; preserve the active query string when opening or
  // closing the drawer so filters survive navigation and the view stays shareable.
  const qs = params.toString();
  const openEvent = (eventId: string) =>
    navigate({ pathname: `/events/${encodeURIComponent(eventId)}`, search: qs });
  const closeEvent = () => navigate({ pathname: "/events", search: qs });

  // Resolve the deep-linked id against the full loaded list (not the filtered
  // one) so a shared link opens even when it falls outside the current filters.
  const selectedEvent = selectedId ? events.find((e) => e.id === selectedId) ?? null : null;

  if (status === "loading") {
    return (
      <div className="page-container">
        <h1>Security Events</h1>
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
        <h1>Security Events</h1>
        <div className="state-panel state-error" role="alert">
          <p>{error}</p>
          <button className="btn-primary" onClick={reload}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const noDataAtAll = events.length === 0;
  const noMatches = !noDataAtAll && visible.length === 0;

  return (
    <div className="page-container">
      <div className="events-header">
        <h1>Security Events</h1>
        <ExportButtons events={visible} />
      </div>

      <HealthBar events={visible} />

      {noDataAtAll ? (
        <div className="state-panel">
          <p>No events have been recorded yet.</p>
        </div>
      ) : (
        <>
          {(() => {
            const urgent = summary.bySeverity.CRITICAL + summary.bySeverity.HIGH;
            const onlyUrgent =
              q.query.severities.length > 0 &&
              q.query.severities.every((s) => s === "CRITICAL" || s === "HIGH");
            if (urgent === 0 || onlyUrgent) return null;
            return (
              <button
                className="triage-banner"
                onClick={() => q.setSeverities(["CRITICAL", "HIGH"])}
              >
                <span className="triage-dot" />
                <strong>{urgent}</strong> high-priority event{urgent === 1 ? "" : "s"} need triage
                <span className="triage-cta">Focus →</span>
              </button>
            );
          })()}

          <SummaryStrip
            summary={summary}
            activeSeverities={q.query.severities}
            onSeverityClick={q.toggleSeverity}
            onTagClick={q.setTag}
            onHostClick={q.setHost}
          />

          <OverviewCharts events={visible} />

          <EventFilters q={q} />

          {noMatches ? (
            <div className="state-panel">
              <p>No events match the current filters.</p>
              <button className="btn-primary" onClick={q.clear}>
                Clear filters
              </button>
            </div>
          ) : (
            <EventsTable
              events={visible}
              sortField={q.query.sortField}
              sortDirection={q.query.sortDirection}
              onSort={q.setSort}
              onSelect={openEvent}
              selectedId={selectedId ?? null}
            />
          )}
        </>
      )}

      {selectedId && (
        <EventDetailDrawer
          event={selectedEvent}
          requestedId={selectedId}
          onClose={closeEvent}
          onTagClick={(tag) => {
            q.setTag(tag);
            closeEvent();
          }}
          onHostClick={(host) => {
            q.setHost(host);
            closeEvent();
          }}
        />
      )}
    </div>
  );
}
