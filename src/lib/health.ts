import type { Severity, SecurityEvent } from "../types";

// "System integrity" — a video-game-style HP score (0–100) summarizing how
// concerned an analyst should be about a set of events. It depletes as threats
// mount. Computed from whatever events are passed in (the *currently filtered*
// view, like the rest of the dashboard), so filtering to the criticals visibly
// drains the bar.
//
// Design:
//  - Each severity contributes a weight; the total is the raw "threat".
//  - Threat is mapped through a saturating curve threat/(threat+SOFTNESS) so the
//    bar scales sensibly with volume (one extra LOW barely moves it; a CRITICAL
//    bites hard) and never quite hits zero from sheer count alone.
//  - The qualitative LEVEL has presence floors: a single CRITICAL forces CRITICAL
//    and any HIGH forces at least ELEVATED — a "boss on screen is always red"
//    rule, so a severe event is never hidden behind a high HP number.

export type ThreatLevel = "SECURE" | "GUARDED" | "ELEVATED" | "HIGH" | "CRITICAL";

const WEIGHTS: Record<Severity, number> = {
  CRITICAL: 50,
  HIGH: 16,
  MEDIUM: 4,
  LOW: 1,
  UNKNOWN: 6, // uncertainty is mildly concerning — a record we couldn't classify
};

const SOFTNESS = 140;

const LEVEL_ORDER: ThreatLevel[] = ["SECURE", "GUARDED", "ELEVATED", "HIGH", "CRITICAL"];

export const LEVEL_COLORS: Record<ThreatLevel, string> = {
  SECURE: "#2ea043",
  GUARDED: "#bcbd2e",
  ELEVATED: "#e08600",
  HIGH: "#d92d20",
  CRITICAL: "#ff4136",
};

export interface HealthResult {
  integrity: number; // 0–100 HP (higher = healthier)
  concern: number; // 0–100 (higher = more concerning)
  level: ThreatLevel;
  color: string;
  total: number;
}

function levelFromIntegrity(integrity: number): ThreatLevel {
  if (integrity >= 80) return "SECURE";
  if (integrity >= 60) return "GUARDED";
  if (integrity >= 40) return "ELEVATED";
  if (integrity >= 20) return "HIGH";
  return "CRITICAL";
}

function maxLevel(a: ThreatLevel, b: ThreatLevel): ThreatLevel {
  return LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b) ? a : b;
}

export function computeHealth(events: SecurityEvent[]): HealthResult {
  const counts: Record<Severity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    UNKNOWN: 0,
  };
  for (const e of events) counts[e.severity] += 1;

  const threat =
    counts.CRITICAL * WEIGHTS.CRITICAL +
    counts.HIGH * WEIGHTS.HIGH +
    counts.MEDIUM * WEIGHTS.MEDIUM +
    counts.LOW * WEIGHTS.LOW +
    counts.UNKNOWN * WEIGHTS.UNKNOWN;

  const total = events.length;
  const concern = total === 0 ? 0 : (100 * threat) / (threat + SOFTNESS);
  const integrity = Math.round(100 - concern);

  let level = levelFromIntegrity(integrity);
  if (counts.CRITICAL > 0) level = "CRITICAL";
  else if (counts.HIGH > 0) level = maxLevel(level, "ELEVATED");

  return { integrity, concern: Math.round(concern), level, color: LEVEL_COLORS[level], total };
}
