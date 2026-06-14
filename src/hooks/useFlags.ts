import { useSyncExternalStore } from "react";
import { getFlags, subscribe, toggleFlag } from "../lib/flagsStore";

// React binding for the flag store. useSyncExternalStore keeps every consumer
// (table rows, drawer, navbar badge, Flagged tab) in sync with the single store
// without prop-drilling or a context provider.
export function useFlags() {
  const flagged = useSyncExternalStore(subscribe, getFlags, getFlags);
  return {
    flagged,
    count: flagged.size,
    isFlagged: (id: string) => flagged.has(id),
    toggle: toggleFlag,
  };
}
