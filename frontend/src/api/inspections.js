import api from "./axios";

// POST /inspections  body { category }  ->  { ins_id, date, status, category }
// The category is chosen later in the workflow, so we start with a placeholder.
export async function createInspection(category = "Unassigned") {
  const { data } = await api.post("/inspections", { category });
  return data;
}

// GET /inspections  ->  [{ ins_id, date, status, category, img_id, has_evaluation, has_report }]
// REQUIRES the new backend endpoint described in BACKEND_CHANGES.md (it does not exist yet).
export async function listInspections() {
  const { data } = await api.get("/inspections");
  return data;
}
