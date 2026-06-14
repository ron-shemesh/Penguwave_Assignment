# PenguWave — Analyst Dashboard (Track B)

A security operations dashboard for an analyst triaging events. Built on the
PenguWave starter, taking the bare events table into a focused workspace:
an at-a-glance overview, fast search/filter/sort, full event detail, and export —
all running frontend-only on the bundled mock data.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run build    # tsc + vite production build
npm run lint     # eslint
npm test         # vitest (unit tests for the pure logic)
```

## What was built

A single **Events workspace** (`/events`) with:

- **Summary strip** — total, counts by severity (as bars), and the top hosts/tags,
  all computed from the *currently filtered* set. Severity bars and facet chips
  double as one-click filters, so the overview and the table never disagree.
- **Search, filters, sort** — debounced full-text search (title, description,
  host, IPs, tags), a severity multi-select, tag/host facets, and sortable columns
  (severity by rank, timestamp, title, host, source IP).
- **Event detail drawer** — a right-side panel with full detail and the raw JSON,
  deep-linkable at `/events/:id` (shareable, refresh-safe, Esc/back to close).
- **Export** — CSV (RFC-4180 escaped) and JSON of exactly the rows currently in
  view: *what you see is what you export*.
- **Messy / loading / empty handling** — a simulated async fetch gives real
  loading, error (with **Retry**), and two distinct empty states ("no events at
  all" vs "no matches"). Every record is normalized so malformed data is shown
  safely rather than crashing the table.

## Key decisions

- **URL is the single source of truth for the view.** Search, filters, sort, and
  the selected event all live in the URL (`useSearchParams` + a `:id` route
  param). Views are shareable and survive refresh and the back button; junk params
  fall back to defaults instead of breaking the page.
- **Three clear layers, one-directional flow.** `services/eventsService.ts` is the
  only thing that touches the raw data (a `Promise` with simulated latency and an
  injectable error). `hooks/` own the fetch lifecycle and the URL-derived query.
  Components are presentation-only. Swapping the service for a real
  `fetch('/api/events')` (Track A) would not touch a single component.
- **Coerce and keep, never throw, never drop.** `lib/validation.ts` normalizes
  every record: missing arrays → `[]`, unknown severity → an `UNKNOWN` badge,
  invalid timestamps → `—`. A bad record stays visible to the analyst.
- **Dependency-light.** No new runtime dependencies — every line is explainable.
  The only addition is Vitest as a dev dependency for tests.

## Security issues found in the starter (and fixed)

The starter had several planted problems. What changed and why:

| Issue | Fix |
| --- | --- |
| Hardcoded `API_TOKEN` (`pw_live_sk_…`) committed in `src/api.ts` | Removed. A static secret in a frontend bundle is readable by anyone; auth now uses a per-session bearer token issued by the backend. |
| Plaintext password logging (`console.log` in `api.ts` and `LoginModal`) | Removed. Credentials are never logged. |
| No-op `sanitizeHtml()` feeding two `dangerouslySetInnerHTML` / `innerHTML` sinks (XSS) | Removed the sinks entirely. All event fields render as plain text — React escapes by default, so no HTML sanitizer is needed. |
| Passwords modeled on `User` and rendered in a "Password" column | Dropped `password` from the type and the UI. Secrets must never reach the client. |
| `DEBUG_BYPASS_AUTH` backdoor in `App.tsx` | Removed. |
| Users page had no authorization | Added a client-side `isAdmin()` gate — with an explicit note that it only hides UI; **real authorization must be enforced by the backend (Track A)**. |
| No `.gitignore` | Added (`node_modules`, `dist`, `.env`). |
| Loose types; naive CSV export that corrupted commas/quotes | Tightened `Severity`/`User` unions; replaced with RFC-4180-escaped CSV in `lib/csv.ts`. |

> **Note on `CRITICAL`:** the mock data contains a `CRITICAL` severity the
> starter's types never accounted for. It's now a first-class severity (ranked
> above `HIGH`); anything still unrecognized is shown as `UNKNOWN`.

## Project layout

```
src/
  services/eventsService.ts   async data boundary (latency + injectable error)
  hooks/                      useEvents (fetch lifecycle), useEventQuery (URL state)
  lib/                        pure helpers: filtering, validation, csv, format, …
  components/                 SummaryStrip, EventFilters, EventsTable,
                              EventDetailDrawer, ExportButtons, SeverityBadge
  pages/                      EventsPage (the workspace), UsersPage, NotFound
```

## Tests

`npm test` runs Vitest over the pure logic where bugs hide: CSV escaping,
filter/sort/summarize, record normalization, and safe date formatting (35 tests).

## What I'd do with more time

- Connect to a real backend (Track A) and move authorization server-side.
- Virtualize the table for very large event volumes.
- Saved views / shareable filter presets beyond the URL, and date-range filtering.
- Component/interaction tests (e.g. React Testing Library) on top of the unit tests.

---

The original starter docs remain in [`ASSIGNMENT.md`](./ASSIGNMENT.md) and
[`docs/api_contract.md`](./docs/api_contract.md).
