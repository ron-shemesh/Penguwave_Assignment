import { useMemo, useState } from "react";
import type { SecurityEvent } from "../types";
import { type Category, eventsByDay, summarizeByCategory } from "../lib/categories";

// A compact, dependency-free overview: events-over-time (spikes = incidents) and
// a clustered category breakdown. Both are computed from the events passed in —
// the *currently filtered* set — so they react live to search/filters and always
// agree with the table. Collapsible so it never crowds out the table.

const CATEGORY_COLORS: Record<Category, string> = {
  "Identity & Access": "#7c3aed",
  Network: "#0891b2",
  Endpoint: "#dc2626",
  "Cloud & Infra": "#2563eb",
  Data: "#d97706",
  Operational: "#64748b",
  Other: "#94a3b8",
};

// MM-DD for compact axis labels; the full date stays in the tooltip.
function shortDay(day: string): string {
  return day === "Unknown" ? "?" : day.slice(5);
}

export default function OverviewCharts({ events }: { events: SecurityEvent[] }) {
  const [open, setOpen] = useState(true);

  const byDay = useMemo(() => eventsByDay(events), [events]);
  const byCategory = useMemo(() => summarizeByCategory(events), [events]);

  const maxDay = Math.max(1, ...byDay.map((d) => d.count));
  const maxCat = Math.max(1, ...byCategory.map((c) => c.count));

  return (
    <section className="charts-panel">
      <button
        className="charts-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="charts-toggle-caret">{open ? "▾" : "▸"}</span>
        Overview charts
      </button>

      {open && (
        <div className="charts-body">
          <div className="chart-block">
            <h3 className="chart-title">Events over time</h3>
            {byDay.length === 0 ? (
              <p className="facet-empty">No data</p>
            ) : (
              <div className="timeline">
                {byDay.map((d) => (
                  <div className="timeline-col" key={d.day} title={`${d.day}: ${d.count} event(s)`}>
                    <span className="timeline-count">{d.count}</span>
                    <span className="timeline-bar-track">
                      <span
                        className="timeline-bar-fill"
                        style={{ height: `${(d.count / maxDay) * 100}%` }}
                      />
                    </span>
                    <span className="timeline-label">{shortDay(d.day)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="chart-block">
            <h3 className="chart-title">By category</h3>
            {byCategory.length === 0 ? (
              <p className="facet-empty">No data</p>
            ) : (
              <div className="category-bars">
                {byCategory.map((c) => (
                  <div className="category-row" key={c.category} title={`${c.category}: ${c.count}`}>
                    <span className="category-label">{c.category}</span>
                    <span className="category-bar-track">
                      <span
                        className="category-bar-fill"
                        style={{
                          width: `${(c.count / maxCat) * 100}%`,
                          background: CATEGORY_COLORS[c.category],
                        }}
                      />
                    </span>
                    <span className="category-count">{c.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
