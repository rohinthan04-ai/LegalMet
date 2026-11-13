// Where "Open / Continue" should take the inspector for a row from GET /inspections.
export function getOpenTarget(inspection) {
  const { ins_id, img_id, has_evaluation } = inspection;
  if (has_evaluation) return { to: `/inspections/${ins_id}/report`, label: "View report" };
  if (img_id) return { to: `/inspections/${ins_id}/images/${img_id}/review`, label: "Continue" };
  return { to: `/inspections/${ins_id}/upload`, label: "Continue" };
}
