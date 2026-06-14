import { useFlags } from "../hooks/useFlags";

// Toggle "flag for follow-up" on a single event. Used in the table and the
// drawer. Stops click propagation so flagging a row never also selects it.
// Uses an inline SVG (not a Unicode/emoji glyph) so the icon renders crisply and
// identically everywhere — outline when unflagged, filled red when flagged.
export default function FlagButton({ eventId }: { eventId: string }) {
  const { isFlagged, toggle } = useFlags();
  const flagged = isFlagged(eventId);

  return (
    <button
      className={`flag-btn${flagged ? " flagged" : ""}`}
      aria-pressed={flagged}
      aria-label={flagged ? "Remove flag" : "Flag for follow-up"}
      title={flagged ? "Flagged for follow-up — click to unflag" : "Flag for follow-up"}
      onClick={(e) => {
        e.stopPropagation();
        toggle(eventId);
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={flagged ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 21V4" />
        <path d="M6 4h11l-2.5 3.5L17 11H6z" />
      </svg>
    </button>
  );
}
