import type { Severity } from "../types";
import { SEVERITY_COLORS } from "../lib/constants";

export default function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className="severity-badge" style={{ background: SEVERITY_COLORS[severity] }}>
      {severity}
    </span>
  );
}
