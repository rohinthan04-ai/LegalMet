// The backend stores UTC times in a column without a timezone, so the JSON has no "Z" suffix.
// Without it, JavaScript would read the time as local time and show it 5.5 hours off in India.
function parseApiDate(value) {
  if (!value) return null;
  const text = String(value);
  const hasTimezone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(text);
  const date = new Date(hasTimezone ? text : `${text}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toTimestamp(value) {
  return parseApiDate(value)?.getTime() ?? 0;
}

export function formatDateTime(value) {
  const date = parseApiDate(value);
  if (!date) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
