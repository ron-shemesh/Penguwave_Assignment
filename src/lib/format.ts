// Safe formatting helpers. Real-world event data has missing or malformed
// timestamps; formatting must degrade gracefully rather than render "Invalid
// Date" or throw.

const PLACEHOLDER = "—";

function parseDate(timestamp: string): Date | null {
  if (!timestamp) return null;
  const d = new Date(timestamp);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Human-readable local datetime, or "—" if the timestamp is missing/invalid. */
export function formatTimestamp(timestamp: string): string {
  const d = parseDate(timestamp);
  return d ? d.toLocaleString() : PLACEHOLDER;
}

/** Sortable numeric key for a timestamp; invalid dates sort last. */
export function timestampSortKey(timestamp: string): number {
  const d = parseDate(timestamp);
  return d ? d.getTime() : -Infinity;
}

const UNITS: [limit: number, secs: number, name: string][] = [
  [60, 1, "second"],
  [3600, 60, "minute"],
  [86400, 3600, "hour"],
  [2592000, 86400, "day"],
  [31536000, 2592000, "month"],
  [Infinity, 31536000, "year"],
];

/** Coarse relative time like "3 hours ago" / "in 2 years", or "—" if invalid. */
export function relativeTime(timestamp: string, now: Date = new Date()): string {
  const d = parseDate(timestamp);
  if (!d) return PLACEHOLDER;
  const diffSec = (d.getTime() - now.getTime()) / 1000;
  const abs = Math.abs(diffSec);
  for (const [limit, secs, name] of UNITS) {
    if (abs < limit) {
      const value = Math.max(1, Math.round(abs / secs));
      const plural = value === 1 ? name : `${name}s`;
      return diffSec < 0 ? `${value} ${plural} ago` : `in ${value} ${plural}`;
    }
  }
  return PLACEHOLDER;
}
