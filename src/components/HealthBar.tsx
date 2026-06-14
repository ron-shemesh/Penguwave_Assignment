import { useMemo } from "react";
import type { SecurityEvent } from "../types";
import { computeHealth } from "../lib/health";

// A video-game-style "system integrity" HP bar. The fill width = integrity, the
// color + level label = how concerned the analyst should be. Reacts to the
// currently filtered events, so it's both an at-a-glance vitals readout and an
// interactive gauge (filter to CRITICAL → watch it drain into the red).
export default function HealthBar({ events }: { events: SecurityEvent[] }) {
  const health = useMemo(() => computeHealth(events), [events]);
  const critical = health.level === "CRITICAL";

  return (
    <div
      className={`health-bar${critical ? " health-critical" : ""}`}
      role="meter"
      aria-valuenow={health.integrity}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`System integrity ${health.integrity}%, threat level ${health.level}`}
    >
      <div className="health-head">
        <span className="health-title">System Integrity</span>
        <span className="health-level" style={{ color: health.color }}>
          {health.level}
        </span>
      </div>

      <div className="health-track">
        <span
          className="health-fill"
          style={{ width: `${health.integrity}%`, background: health.color }}
        />
        <span className="health-hp">{health.integrity}%</span>
      </div>

      <div className="health-foot">
        {health.total === 0
          ? "No events in view — nominal"
          : `${health.total} event${health.total === 1 ? "" : "s"} in view · concern ${health.concern}/100`}
      </div>
    </div>
  );
}
