import type { SecurityEvent } from "../types";

// Events carry ~90 distinct free-form tags — too granular to chart usefully.
// We cluster them into a handful of semantic categories so the overview reads at
// a glance. Each event is assigned a single PRIMARY category (so the breakdown
// sums to the total), choosing the highest-priority category among its tags:
// threat-oriented buckets win over routine/operational ones, so a noteworthy
// event is never hidden under a "routine" tag it also happens to carry.

export const CATEGORIES = [
  "Identity & Access",
  "Network",
  "Endpoint",
  "Cloud & Infra",
  "Data",
  "Operational",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

// Priority order = the order of CATEGORIES above (most security-relevant first).
// "Operational" and "Other" sit last so they only win when nothing else matches.
const TAG_TO_CATEGORY: Record<string, Category> = {
  // Identity & Access
  authentication: "Identity & Access",
  iam: "Identity & Access",
  "mfa-bypass": "Identity & Access",
  "brute-force": "Identity & Access",
  "credential-stuffing": "Identity & Access",
  "credential-theft": "Identity & Access",
  "privilege-escalation": "Identity & Access",
  "pass-the-hash": "Identity & Access",
  "session-hijack": "Identity & Access",
  "password-policy": "Identity & Access",
  "password-reset": "Identity & Access",
  "access-review": "Identity & Access",
  "active-directory": "Identity & Access",
  "service-account": "Identity & Access",
  "unauthorized-access": "Identity & Access",
  mimikatz: "Identity & Access",

  // Network
  network: "Network",
  firewall: "Network",
  ssh: "Network",
  vpn: "Network",
  "port-scan": "Network",
  dns: "Network",
  "dns-tunneling": "Network",
  "icmp-tunnel": "Network",
  reconnaissance: "Network",
  "lateral-movement": "Network",
  smb: "Network",
  c2: "Network",
  tor: "Network",
  "web-attack": "Network",
  waf: "Network",
  "sql-injection": "Network",

  // Endpoint
  endpoint: "Endpoint",
  malware: "Endpoint",
  ransomware: "Endpoint",
  powershell: "Endpoint",
  "reverse-shell": "Endpoint",
  webshell: "Endpoint",
  "process-anomaly": "Endpoint",
  "unsigned-binary": "Endpoint",
  persistence: "Endpoint",
  edr: "Endpoint",
  antivirus: "Endpoint",
  windows: "Endpoint",
  "device-enrollment": "Endpoint",
  "unmanaged-device": "Endpoint",
  mdm: "Endpoint",
  "agent-update": "Endpoint",
  firmware: "Endpoint",

  // Cloud & Infra
  cloud: "Cloud & Infra",
  s3: "Cloud & Infra",
  kubernetes: "Cloud & Infra",
  container: "Cloud & Infra",
  misconfiguration: "Cloud & Infra",
  "configuration-change": "Cloud & Infra",
  "forwarding-rule": "Cloud & Infra",
  "supply-chain": "Cloud & Infra",
  github: "Cloud & Infra",
  "secret-exposure": "Cloud & Infra",
  "api-abuse": "Cloud & Infra",
  "rate-limit": "Cloud & Infra",

  // Data
  exfiltration: "Data",
  "data-exposure": "Data",
  "data-access": "Data",
  "data-loss": "Data",
  "data-scraping": "Data",
  database: "Data",
  encryption: "Data",
  certificate: "Data",
  expiry: "Data",

  // Operational (routine / housekeeping / governance)
  routine: "Operational",
  maintenance: "Operational",
  compliance: "Operational",
  audit: "Operational",
  training: "Operational",
  awareness: "Operational",
  simulation: "Operational",
  monitoring: "Operational",
  siem: "Operational",
  soc: "Operational",
  "shift-handover": "Operational",
  "health-check": "Operational",
  update: "Operational",
  patching: "Operational",
  backup: "Operational",
  "disaster-recovery": "Operational",
  failover: "Operational",
  "vulnerability-scan": "Operational",
  "policy-violation": "Operational",
  "shadow-it": "Operational",
  onboarding: "Operational",
};

const PRIORITY = new Map<Category, number>(CATEGORIES.map((c, i) => [c, i]));

/** The single primary category for an event — highest-priority tag match, else "Other". */
export function categorizeEvent(event: SecurityEvent): Category {
  let best: Category = "Other";
  let bestRank = PRIORITY.get("Other")!;
  for (const tag of event.tags) {
    const cat = TAG_TO_CATEGORY[tag.toLowerCase()];
    if (cat) {
      const rank = PRIORITY.get(cat)!;
      if (rank < bestRank) {
        best = cat;
        bestRank = rank;
      }
    }
  }
  return best;
}

export interface CategoryCount {
  category: Category;
  count: number;
}

/** Counts per category across the given events, in CATEGORIES order, zeros dropped. */
export function summarizeByCategory(events: SecurityEvent[]): CategoryCount[] {
  const counts = new Map<Category, number>();
  for (const e of events) {
    const c = categorizeEvent(e);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return CATEGORIES.map((category) => ({ category, count: counts.get(category) ?? 0 })).filter(
    (c) => c.count > 0,
  );
}

export interface DayCount {
  day: string; // YYYY-MM-DD
  count: number;
}

/** Event counts bucketed by calendar day (UTC), chronologically. Records with a
 *  missing/invalid timestamp are grouped under an "Unknown" bucket sorted last,
 *  so messy dates are surfaced rather than silently dropped or skewing a time axis. */
export function eventsByDay(events: SecurityEvent[]): DayCount[] {
  const counts = new Map<string, number>();
  for (const e of events) {
    const d = new Date(e.timestamp);
    const day = e.timestamp && !Number.isNaN(d.getTime()) ? e.timestamp.slice(0, 10) : "Unknown";
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => {
      if (a.day === "Unknown") return 1;
      if (b.day === "Unknown") return -1;
      return a.day < b.day ? -1 : a.day > b.day ? 1 : 0;
    });
}
