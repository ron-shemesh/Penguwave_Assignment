import { SEVERITIES, type Severity } from "../types";
import { SEVERITY_COLORS } from "../lib/constants";
import type { EventSummary } from "../lib/filtering";

interface SummaryStripProps {
  summary: EventSummary;
  activeSeverities: Severity[];
  onSeverityClick: (severity: Severity) => void;
  onTagClick: (tag: string) => void;
  onHostClick: (host: string) => void;
}

// At-a-glance overview computed from the *currently filtered* events, so the
// numbers always match the table below. Severity cards and facet chips double as
// one-click filters.
export default function SummaryStrip({
  summary,
  activeSeverities,
  onSeverityClick,
  onTagClick,
  onHostClick,
}: SummaryStripProps) {
  const maxSeverity = Math.max(1, ...SEVERITIES.map((s) => summary.bySeverity[s]));

  return (
    <div className="summary-strip">
      <div className="summary-card summary-total">
        <span className="summary-num">{summary.total}</span>
        <span className="summary-label">events shown</span>
      </div>

      <div className="summary-severities">
        {SEVERITIES.map((s) => {
          const count = summary.bySeverity[s];
          const active = activeSeverities.includes(s);
          return (
            <button
              key={s}
              className={`severity-bar-row${active ? " active" : ""}`}
              onClick={() => onSeverityClick(s)}
              title={`Filter by ${s}`}
            >
              <span className="severity-bar-label">{s}</span>
              <span className="severity-bar-track">
                <span
                  className="severity-bar-fill"
                  style={{
                    width: `${(count / maxSeverity) * 100}%`,
                    background: SEVERITY_COLORS[s],
                  }}
                />
              </span>
              <span className="severity-bar-count">{count}</span>
            </button>
          );
        })}
        {summary.bySeverity.UNKNOWN > 0 && (
          <div className="severity-unknown-note">
            {summary.bySeverity.UNKNOWN} record(s) with unrecognized severity
          </div>
        )}
      </div>

      <div className="summary-facets">
        <div className="facet-group">
          <span className="facet-title">Top hosts</span>
          {summary.topHosts.length === 0 && <span className="facet-empty">—</span>}
          {summary.topHosts.map((h) => (
            <button key={h.value} className="facet-chip" onClick={() => onHostClick(h.value)}>
              {h.value} <span className="facet-chip-count">{h.count}</span>
            </button>
          ))}
        </div>
        <div className="facet-group">
          <span className="facet-title">Top tags</span>
          {summary.topTags.length === 0 && <span className="facet-empty">—</span>}
          {summary.topTags.map((t) => (
            <button key={t.value} className="facet-chip" onClick={() => onTagClick(t.value)}>
              {t.value} <span className="facet-chip-count">{t.count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
