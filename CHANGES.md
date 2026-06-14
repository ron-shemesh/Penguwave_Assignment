# CHANGES — PenguWave Analyst Dashboard (Track B)

A record of what was wrong in the starter and how it was fixed, what was built,
and the reasoning behind each decision. Track B: turn the bare starter into a
genuinely useful security-operations dashboard, frontend-only on mock data.

---

## Part 1 — Issues found in the starter code (and fixed)

### Security

| # | Issue | Risk | Fix | Reasoning |
|---|-------|------|-----|-----------|
| 1 | Hardcoded API secret `API_TOKEN = "pw_live_sk_…"` committed in `src/api.ts` | A live-looking secret in a frontend bundle is readable by anyone who opens devtools or the shipped JS. | Removed it entirely; calls now use a per-session bearer token issued by the backend at login. | Frontend code is public. Secrets belong on the server, never in the client bundle. |
| 2 | Plaintext password logging — `console.log("Login attempt:", email, password)` in `api.ts` and `LoginModal` | Credentials leak into browser consoles, log aggregators, and screen-shares. | Removed all credential logging. | Never log secrets, anywhere. |
| 3 | No-op `sanitizeHtml()` feeding `dangerouslySetInnerHTML` + a manual `innerHTML` in `EventsPage` | Stored XSS: a crafted event `description` or the echoed search string executes arbitrary script. | Removed both sinks. All event fields render as plain text (React escapes by default). Deleted the dead `sanitizeHtml`. | The safest sanitizer is not injecting HTML at all. No DOMPurify dependency needed. |
| 4 | Passwords modeled on the `User` type and shown in a "Password" column on the Users page | Secrets displayed in the UI and held in client state. | Dropped `password` from the type and the UI; user creation no longer collects one. | The client must never see or store credentials. |
| 5 | `DEBUG_BYPASS_AUTH` backdoor flag in `App.tsx` | A one-line flip disables the auth gate; easy to ship enabled by accident. | Removed the flag. | Debug auth bypasses don't belong in committed code. |
| 6 | Users page had no authorization (`// TODO: add role check`) | Any visitor could view/add/delete users. | Added a client-side `isAdmin()` gate with an explicit note that it only hides UI — **real authorization must be enforced by the backend (Track A)**. | Honest about what a frontend can and cannot secure; the gate is UX, not a security boundary. |
| 7 | No `.gitignore` | Risk of committing `node_modules`, build output, or `.env` secrets. | Added `.gitignore` (`node_modules`, `dist`, `.env`). | Keep secrets and noise out of git. |

### Correctness / data handling

| # | Issue | Fix | Reasoning |
|---|-------|-----|-----------|
| 8 | Naive CSV export: `headers.map(h => String(r[h])).join(",")` | New `lib/csv.ts` with RFC-4180 escaping (quote-wrap + double quotes) and explicit ordered columns. | Descriptions and tag lists routinely contain commas/quotes/newlines that corrupted the old export. |
| 9 | `CRITICAL` severity in the data was unaccounted for in the types | Promoted `CRITICAL` to a first-class, top-ranked severity across types/constants/filtering. | Without it, every CRITICAL event silently became `UNKNOWN` — the single most important events, hidden. |
| 10 | Loose types; raw `mock_events.json` read directly with no validation | Tight `Severity`/`UserRole`/`UserStatus` unions; `lib/validation.ts` normalizes every record (missing arrays → `[]`, bad severity → `UNKNOWN`, etc.). | Real feeds have messy records. Coerce-and-keep so a bad record stays visible rather than crashing the table. |
| 11 | Timestamps rendered via `new Date(...).toLocaleString()` with no guard | `lib/format.ts` returns `—` for missing/invalid dates and sorts them last. | Avoids "Invalid Date" in the UI; a far-future outlier (`2099-12-31`) exists in the data. |
| 12 | Login modal auto-popped on every visit | Made it opt-in (opens only on the "Login" click). | Hostile UX for a read-only dashboard; auto-prompts train users to dismiss auth dialogs without reading. |

---

## Part 2 — Features added

| Feature | What it does | Reasoning |
|---------|--------------|-----------|
| **Async data layer** (`services/eventsService.ts`) | Wraps the mock JSON in a `Promise` with simulated latency and an injectable error. | One real async boundary → genuine loading/error/empty code paths, and a one-line swap to a real backend (Track A) without touching components. |
| **URL-driven state** (`hooks/useEventQuery.ts`) | Search, filters, sort, and selected event live in the URL. | Views become shareable, refresh-safe, and back-button friendly. Junk params fall back to defaults. |
| **Summary strip** | Total + counts by severity (bars) + top hosts/tags, from the *filtered* set; click to filter. | At-a-glance triage; counts always match the table by construction. |
| **Overview charts** (`OverviewCharts.tsx`) | Events-over-time (by day) + clustered category breakdown, pure CSS bars, react to filters. | "Spikes = incidents" is the chart a SOC analyst always wants; clustering ~90 tags into 6 categories turns noise into signal. |
| **Tag clustering** (`lib/categories.ts`) | Maps each event to one primary category (Identity, Network, Endpoint, Cloud, Data, Operational), threat categories prioritized. | Raw tags are too granular to chart; a threat event must never hide under a "routine" tag it also carries. |
| **Sortable events table + detail drawer** | Sortable columns; row → deep-linkable `/events/:id` drawer with full detail + raw JSON; graceful not-found. | Core triage workflow; deep links make a specific event shareable. |
| **Export (CSV + JSON)** | Exports exactly the rows currently in view. | "What you see is what you export" — the export always matches the analyst's current filter. |
| **Triage focus banner** | When CRITICAL/HIGH events are present, a pulsing banner one-click-filters to just those. | Gets the analyst to the events that matter first, in one click. |
| **Relative-time tooltips** | Hovering a timestamp shows "3 hours ago" / "in 2 years". | Faster temporal sense-making; also makes the `2099` outlier obvious. |
| **Ask AI tab** (`pages/AskAiPage.tsx`) | Chat-style UI with suggested questions; **placeholder, not connected**. | Demonstrates the intended analyst-assistant UX. Deliberately unwired — a real version would POST the question + filtered events to a backend holding the model key (never the browser). |
| **System integrity health bar** (`lib/health.ts`, `HealthBar.tsx`) | A video-game-style HP bar (0–100) summarizing how concerned to be about the current view. Severity-weighted threat through a saturating curve; presence floors force CRITICAL/ELEVATED so a severe event never hides behind a high score. | One-glance posture readout; reacts to filters (filter to criticals → the bar drains into the red), making "how bad is it?" instantly legible. |
| **Matrix boot intro** (`MatrixIntro.tsx`) | A short Matrix-style digital-rain boot sequence on first open; plays once per session, skippable, and disabled under `prefers-reduced-motion`. | Sets the "security console" tone coherently with the dark theme, without nagging on every navigation or fighting accessibility settings. |
| **Flag for follow-up + Flagged tab** (`lib/flagsStore.ts`, `useFlags`, `FlagButton`, `pages/FlaggedPage.tsx`) | A flag toggle next to every event (table + drawer); flagged events get a navbar badge and a dedicated Flagged tab (which reuses the table/export/health bar). Flags persist in `localStorage` and sync across tabs. | Gives the analyst a personal triage worklist — "these are the ones I'm going to handle." A tiny shared store (via `useSyncExternalStore`) keeps the table, drawer, badge, and tab consistent without prop-drilling. Persisted client-side since this is frontend-only; in Track A it would be a per-user backend field — only the store boundary changes. |
| **Unit tests** (Vitest, 43 tests) | Cover csv escaping, filter/sort/summarize, validation, formatting, categorization. | The pure logic is where bugs hide; tests make the behavior explainable and regression-safe. |
| **Matrix theme** | Green-on-black palette + monospace type + subtle scanning-grid backdrop and green glow, all driven by CSS variables. | A cohesive "security console" aesthetic across every page; severity reds/oranges pop against it. Variable-driven so the whole site re-themes from one place. |
| **Professional login modal** | Rebuilt the sign-in as a console-style card: lock mark, clear hierarchy, focus-glow inputs, autocomplete hints, and a note that auth is backend-handled. | The starter's modal was bare and auto-popped; the new one looks like a real product sign-in and is honest about being a frontend preview. |

---

## Part 3 — Architecture & key decisions

- **Three layers, one-directional flow:** `service` (data) → `hooks` (lifecycle + URL query) → `components` (presentation). Components never touch async or raw JSON.
- **Dependency-light:** no new runtime dependencies. Charts are CSS bars, not a chart library — every line is explainable in the presentation. The only addition is Vitest (dev-only).
- **Messy-data-first:** validation normalizes records, formatting guards bad dates, the timeline buckets invalid timestamps under "Unknown", and there are distinct empty states ("no events" vs "no matches").

## What I'd do next with more time

- Connect a real backend (Track A) and move authorization server-side.
- Wire the Ask AI tab to a backend assistant grounded on the filtered events.
- Make category bars click-to-filter (needs a `category` filter in the query layer).
- Virtualize the table for very large event volumes; add date-range filtering.
