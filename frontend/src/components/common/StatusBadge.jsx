import { INSPECTION_STATUS } from "../../utils/status";

// Badge for an inspection's status ("pending" | "completed").
export default function StatusBadge({ status }) {
  const config = INSPECTION_STATUS[status] || { label: status || "Unknown", badge: "bg-navy-100 text-navy-700" };
  return <span className={`badge ${config.badge}`}>{config.label}</span>;
}
