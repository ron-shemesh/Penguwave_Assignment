# PenguWave Analyst Dashboard — Design (Track B)

## Context

PenguWave is a frontend-only security operations portal. The starter renders a
login modal, a basic events table (reading `data/mock_events.json` directly),
and a users page. The bootcamp task (Track B) is to turn this bare starter into
the best security operations dashboard we can for an analyst triaging events —
and, along the way, to review and fix the issues planted in the existing code.

A code review surfaced several real problems we will fix as part of this work:
a committed live-looking API secret, plaintext password logging, a no-op HTML
sanitizer feeding two XSS sinks, passwords modeled and displayed in the UI, no
`.gitignore`, a `DEBUG_BYPASS_AUTH` backdoor, and loose types.

Goal: a genuinely useful, pleasant analyst workspace that behaves well with
messy, loading, and empty data — built dependency-light so every line is
explainable in the final presentation.

## Scope (decisions locked)

- **Track:** B (Frontend). Stays frontend-only on mock data; no backend.
- **Ambition:** Breadth — hit all five requirements solidly — *plus* fix the
  planted frontend security issues and be ready to talk about them.
- **Dependencies:** Dependency-light. No new runtime deps. Dev-only: Vitest for
  unit tests.
- **Data layer:** A thin async data service over the mock JSON (Promise +
  simulated latency) so loading/error/empty are real code paths; one place to
  validate/normalize records.
- **Layout:** Single Events workspace — a summary strip above a sortable table,
  with full detail in a right-side drawer. Detail is deep-linkable at
  `/events/:id`.
- **State:** URL-driven. Search, filters, sort, and selected event live in the
  URL (`useSearchParams` + route param), so views are shareable, refresh-safe,
  and back-button friendly.
- **Interactions:** debounced text search; faceted filters (severity
  multi-select + tag/host); column sorting; export of the current view to both
  CSV (properly escaped) and JSON.

## Architecture

Three clear layers, one-directional data flow:

```
data/mock_events.json
        │
src/services/eventsService.ts   ← async boundary: Promise + simulated latency,
        │                          validates/normalizes raw records, can inject errors
src/hooks/ (useEvents, useEventQuery)  ← fetch lifecycle + URL-derived filter/sort
        │
src/pages/EventsPage.tsx + components/  ← presentation only
```

Data flows down from `URL + fetched data`; the only writes are filter/sort/
selection changes pushed back into the URL. Summary strip, table, and export all
read the same derived (filtered+sorted) list, so "what you see is what you
export, and the counts always match" holds by construction.

### File layout

- `src/services/eventsService.ts` — only place that touches raw JSON. Returns
  `Promise<SecurityEvent[]>`, simulates latency, validates/normalizes each
  record. Supports an injectable error for demoing the error state.
- `src/hooks/useEvents.ts` — wraps the service; exposes
  `{ status: 'loading'|'error'|'ready', events, error, reload }`.
- `src/hooks/useEventQuery.ts` — reads/writes search, severity, tag, host, sort
  from the URL; returns derived list + setters. Ignores junk params.
- `src/components/` — `SummaryStrip`, `EventsTable`, `EventFilters`,
  `EventDetailDrawer`, `SeverityBadge`, plus loading/empty/error views.
- `src/lib/` — pure helpers: `csv.ts` (escaping), `filtering.ts` (filter+sort),
  `format.ts` (safe date formatting), `validation.ts` (record normalization),
  `constants.ts` (severities, roles, storage keys).

## Components & flow

1. **SummaryStrip** — counts by severity (CSS bars), total, notable hosts/tags,
   computed from the *currently filtered* set; severity acts as a filter
   shortcut.
2. **EventFilters** — debounced search + severity multi-select + tag/host
   facets; writes to the URL, holds no truth of its own.
3. **EventsTable** — sortable columns (severity by rank, timestamp, host, source
   IP); row click selects; export buttons (CSV + JSON) act on current rows.
4. **EventDetailDrawer** — right-side drawer driven by `/events/:id`; full
   detail + raw JSON; back button closes it; bad id → graceful "event not
   found".

## Messy / loading / empty handling

- **Loading:** skeleton/spinner during the simulated ~400ms fetch.
- **Error:** error panel with **Retry** (`reload()`); service can simulate
  errors for the demo.
- **Empty:** two distinct states — "no events at all" vs "no matches for current
  filters" (with a Clear-filters action).
- **Validation (`lib/validation.ts`):** every record normalized — missing arrays
  → `[]`, missing/invalid severity → `UNKNOWN` badge, invalid timestamp guarded
  in formatting (`format.ts` → "—"). Records are kept and rendered safely;
  nothing crashes the table.
- **Junk URL params:** unknown values fall back to defaults.

## Security fixes (review findings)

- Remove hardcoded `API_TOKEN` from `src/api.ts`.
- Remove plaintext password `console.log`s (`api.ts`, `LoginModal`).
- Eliminate the two HTML-injection sinks in `EventsPage` — render description and
  search echo as plain text (React escapes by default). No DOMPurify dependency
  needed. Remove the now-unused no-op `sanitizeHtml`.
- Drop `password` from the `User` type and the Users table (never model/display
  secrets); add a client-side admin gate via `isAdmin()` with a note that real
  authorization requires a backend (Track A).
- Add `.gitignore` (node_modules, dist, .env).
- Remove the `DEBUG_BYPASS_AUTH` backdoor.
- Tighten types: `Severity` union (incl. `UNKNOWN`), `User.role`/`status` unions;
  make `userId` optional and document the contract discrepancy in the README.

## Testing (bonus)

Add Vitest (dev-dep). Unit tests on the pure functions where bugs hide:
- `csv.ts` — escaping of commas, quotes, newlines; array fields (tags).
- `filtering.ts` — search match, severity/tag/host filters, sort order/direction.
- `validation.ts` — normalization of missing/invalid fields.
- `format.ts` — invalid/missing timestamps render safely.

## Verification

- `npm run dev` → exercise: loading state, error+retry, empty vs no-match,
  search/filter/sort, deep-link a filtered view + an event drawer, export CSV/JSON
  and confirm the export matches the visible rows and opens cleanly in a
  spreadsheet.
- `npm run lint` clean; `npm run build` (tsc + vite) succeeds.
- `npx vitest run` — unit tests pass.

## Git / deliverables

- Work on `feature/analyst-dashboard`; small, clear commits.
- Update `README.md`: how to run, what was built, key decisions, and the review
  findings that were fixed.
- Open a PR; merge to `main` when ready.
