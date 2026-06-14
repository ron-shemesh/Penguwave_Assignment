import { STORAGE_KEYS } from "./constants";

// A tiny shared store for "flagged for follow-up" event ids. Frontend-only, so
// flags persist in localStorage and survive refresh; they also sync across tabs
// via the `storage` event. It's a minimal pub/sub designed for React's
// useSyncExternalStore (see hooks/useFlags.ts), so the table, the detail drawer,
// the navbar badge, and the Flagged tab all stay consistent from one source.
//
// In a real (Track A) app this would be a per-user field on the backend; the
// store boundary is the only thing that would change.

type Listener = () => void;

const listeners = new Set<Listener>();
let current: Set<string> = load();

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.flags);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.flags, JSON.stringify([...current]));
  } catch {
    // Storage may be unavailable (private mode, quota); flags stay in-memory.
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

/** Pure helper (exported for tests): the next flag set after toggling `id`. */
export function nextFlagSet(currentSet: Set<string>, id: string): Set<string> {
  const next = new Set(currentSet);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function getFlags(): Set<string> {
  return current;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function toggleFlag(id: string): void {
  current = nextFlagSet(current, id);
  persist();
  emit();
}

// Keep tabs in sync when another tab edits the same key.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEYS.flags) {
      current = load();
      emit();
    }
  });
}
