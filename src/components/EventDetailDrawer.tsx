import { useEffect } from "react";
import type { SecurityEvent } from "../types";
import { formatTimestamp } from "../lib/format";
import SeverityBadge from "./SeverityBadge";
import FlagButton from "./FlagButton";

interface EventDetailDrawerProps {
  // The resolved event, or null when the id in the URL matches nothing.
  event: SecurityEvent | null;
  // The id requested in the URL, used for the not-found message.
  requestedId: string;
  onClose: () => void;
  onTagClick: (tag: string) => void;
  onHostClick: (host: string) => void;
}

// Right-side drawer driven by /events/:id, so any event is deep-linkable and
// refresh-safe. The description is rendered as plain text (React escapes it) —
// this is the sink the starter exposed to XSS via dangerouslySetInnerHTML.
export default function EventDetailDrawer({
  event,
  requestedId,
  onClose,
  onTagClick,
  onHostClick,
}: EventDetailDrawerProps) {
  // Esc closes the drawer — expected behaviour for an overlay panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-label="Event details"
        onClick={(e) => e.stopPropagation()}
      >
        {event ? (
          <>
            <div className="drawer-header">
              <SeverityBadge severity={event.severity} />
              <div className="drawer-actions">
                <FlagButton eventId={event.id} />
                <button className="drawer-close" onClick={onClose} aria-label="Close details">
                  ✕
                </button>
              </div>
            </div>

            <h2 className="drawer-title">{event.title}</h2>

            <section className="drawer-section">
              <h3>Description</h3>
              <p className="drawer-description">{event.description || "—"}</p>
            </section>

            <section className="drawer-section">
              <h3>Details</h3>
              <dl className="drawer-fields">
                <dt>Event ID</dt>
                <dd className="cell-mono">{event.id}</dd>

                <dt>Timestamp</dt>
                <dd>
                  {formatTimestamp(event.timestamp)}
                  {event.timestamp && <span className="drawer-raw-ts"> ({event.timestamp})</span>}
                </dd>

                <dt>Asset</dt>
                <dd>
                  {event.assetHostname ? (
                    <button className="link-button" onClick={() => onHostClick(event.assetHostname)}>
                      {event.assetHostname}
                    </button>
                  ) : (
                    "—"
                  )}
                  <span className="cell-mono"> {event.assetIp && `(${event.assetIp})`}</span>
                </dd>

                <dt>Source IP</dt>
                <dd className="cell-mono">{event.sourceIp || "—"}</dd>

                {event.userId && (
                  <>
                    <dt>User ID</dt>
                    <dd className="cell-mono">{event.userId}</dd>
                  </>
                )}
              </dl>
            </section>

            <section className="drawer-section">
              <h3>Tags</h3>
              {event.tags.length > 0 ? (
                <div className="drawer-tags">
                  {event.tags.map((tag) => (
                    <button key={tag} className="facet-chip" onClick={() => onTagClick(tag)}>
                      {tag}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="facet-empty">No tags</p>
              )}
            </section>

            <section className="drawer-section">
              <h3>Raw event</h3>
              <pre className="drawer-raw">{JSON.stringify(event, null, 2)}</pre>
            </section>
          </>
        ) : (
          <div className="drawer-notfound">
            <div className="drawer-header">
              <button className="drawer-close" onClick={onClose} aria-label="Close details">
                ✕
              </button>
            </div>
            <h2 className="drawer-title">Event not found</h2>
            <p>
              No event matches <code>{requestedId}</code>. It may have been removed, or the link is
              out of date.
            </p>
            <button className="btn-primary" onClick={onClose}>
              Back to events
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
