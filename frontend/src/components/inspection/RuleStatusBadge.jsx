import { RULE_STATUS } from "../../utils/status";

// Pass (green) / Fail (red) / Unable to verify (amber). The icon means colour is never the only signal.
export default function RuleStatusBadge({ status }) {
  const config = RULE_STATUS[status];
  if (!config) return <span className="badge bg-navy-100 text-navy-700">{status}</span>;
  const Icon = config.icon;
  return (
    <span className={`badge ${config.badge}`}>
      <Icon className="h-3.5 w-3.5" /> {config.label}
    </span>
  );
}
