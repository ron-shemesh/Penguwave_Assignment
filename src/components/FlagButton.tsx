import { useFlags } from "../hooks/useFlags";

// Toggle "flag for follow-up" on a single event. Used in the table and the
// drawer. Stops click propagation so flagging a row never also selects it.
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
      {flagged ? "🚩" : "⚐"}
    </button>
  );
}
