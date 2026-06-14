import rawEvents from "../../data/mock_events.json";
import type { SecurityEvent } from "../types";
import { normalizeEvents } from "../lib/validation";
import { FETCH_LATENCY_MS } from "../lib/constants";

// The single async boundary between the UI and the data source. Today it reads
// bundled mock JSON; swapping this for a real `fetch('/api/events')` (Track A)
// would not touch any component. Simulated latency + an injectable failure mode
// give the dashboard real loading/error code paths to handle.

let forcedError = false;

/** Test/demo hook: when true, the next getEvents() call rejects. */
export function setForcedError(value: boolean): void {
  forcedError = value;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getEvents(): Promise<SecurityEvent[]> {
  await delay(FETCH_LATENCY_MS);
  if (forcedError) {
    throw new Error("Failed to load events. The events service is unavailable.");
  }
  return normalizeEvents(rawEvents);
}

export async function getEventById(id: string): Promise<SecurityEvent | null> {
  const events = await getEvents();
  return events.find((e) => e.id === id) ?? null;
}
