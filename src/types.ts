// Domain types for PenguWave.

export const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export type KnownSeverity = (typeof SEVERITIES)[number];

// "UNKNOWN" is not a real severity — it is what we coerce malformed records to,
// so a bad record is still visible to the analyst instead of crashing the table.
export type Severity = KnownSeverity | "UNKNOWN";

export interface SecurityEvent {
  id: string;
  timestamp: string;
  severity: Severity;
  title: string;
  description: string;
  assetHostname: string;
  assetIp: string;
  sourceIp: string;
  tags: string[];
  // Present in the mock data but absent from the API contract. Kept optional and
  // documented as a discrepancy rather than silently dropped.
  userId?: string;
}

export const USER_ROLES = ["admin", "analyst", "viewer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["active", "disabled"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

// Note: no `password` field. Secrets must never be modeled or rendered on the
// client (the API contract says passwords must never leave the server).
export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}
