import type { SecurityEvent } from "../types";
import { eventsToCsv, eventsToJson } from "../lib/csv";
import { downloadFile } from "../lib/download";

// Exports exactly the rows passed in (the current filtered view), so "what you
// see is what you export" holds. Disabled when there is nothing to export.
export default function ExportButtons({ events }: { events: SecurityEvent[] }) {
  const disabled = events.length === 0;

  const exportCsv = () =>
    downloadFile("penguwave_events.csv", eventsToCsv(events), "text/csv;charset=utf-8");

  const exportJson = () =>
    downloadFile("penguwave_events.json", eventsToJson(events), "application/json");

  return (
    <div className="export-buttons">
      <button onClick={exportCsv} disabled={disabled}>
        Export CSV
      </button>
      <button onClick={exportJson} disabled={disabled}>
        Export JSON
      </button>
    </div>
  );
}
