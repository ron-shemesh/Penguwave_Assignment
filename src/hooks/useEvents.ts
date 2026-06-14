import { useCallback, useEffect, useState } from "react";
import type { SecurityEvent } from "../types";
import { getEvents } from "../services/eventsService";

type Status = "loading" | "error" | "ready";

interface UseEventsResult {
  status: Status;
  events: SecurityEvent[];
  error: string | null;
  reload: () => void;
}

// Owns the fetch lifecycle for the events list: loading / error / ready, plus a
// reload() for the error-state retry button. Components never call the service
// directly, so they stay free of async plumbing.
export function useEvents(): UseEventsResult {
  const [status, setStatus] = useState<Status>("loading");
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Flip to loading here (an event handler, not the effect) and bump the token
  // to trigger a refetch. Keeping setState out of the effect body avoids the
  // cascading-render pattern the hooks linter warns about.
  const reload = useCallback(() => {
    setStatus("loading");
    setError(null);
    setReloadToken((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    getEvents()
      .then((data) => {
        if (cancelled) return;
        setEvents(data);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unknown error loading events.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { status, events, error, reload };
}
