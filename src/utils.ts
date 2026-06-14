// Shared helpers for PenguWave.
//
// Removed from the starter:
//  - sanitizeHtml(): a no-op ("TODO: wire up DOMPurify") that fed two
//    dangerouslySetInnerHTML / innerHTML sinks — a real XSS hole. The dashboard
//    now renders all event fields as plain text (React escapes by default), so
//    no HTML sanitizer is needed at all.
//  - toCsv(): a naive join(",") with no escaping that corrupted any value
//    containing a comma/quote/newline. Replaced by lib/csv.ts (RFC 4180 escaping).

import { STORAGE_KEYS } from "./lib/constants";

/**
 * Whether the current user has admin privileges.
 *
 * NOTE: this is a client-side convenience gate only — it hides UI, it does not
 * secure anything. Real authorization must be enforced by the backend (Track A);
 * a determined user can set this value in devtools.
 */
export function isAdmin(): boolean {
  return localStorage.getItem(STORAGE_KEYS.role) === "admin";
}
