import type { Severity } from "../types";

// Visual rank for sorting: higher number = more urgent. UNKNOWN sorts last.
export const SEVERITY_RANK: Record<Severity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  UNKNOWN: 0,
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  CRITICAL: "#7f1d1d",
  HIGH: "#d92d20",
  MEDIUM: "#e08600",
  LOW: "#2e7d32",
  UNKNOWN: "#888888",
};

// localStorage / sessionStorage keys, centralized to avoid magic strings.
export const STORAGE_KEYS = {
  token: "token",
  role: "role",
  loginDismissed: "login-dismissed",
  introShown: "pw-intro-shown",
} as const;

// Simulated network latency for the mock data service (ms).
export const FETCH_LATENCY_MS = 400;
