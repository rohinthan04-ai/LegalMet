import api from "./axios";

// GET /categories  ->  [{ c_id, category_name }]  (sorted by name)
export async function getCategories() {
  const { data } = await api.get("/categories");
  return data;
}

// GET /categories/{cId}/rules  ->  [{ r_id, rule, is_mandatory }]
// `rule` is one long text blob with sections such as "RULE TITLE:" and "LEGAL REFERENCE:".
export async function getCategoryRules(cId) {
  const { data } = await api.get(`/categories/${cId}/rules`);
  return data;
}

// POST /categories/{cId}/images/{imgId}/evaluate
// ->  { inspection_evaluation: [{ r_id, status, reason, evidence }] }
// status is PASS | FAIL | UNABLE_TO_VERIFY. Calls Gemini and also marks the inspection "completed".
export async function evaluateImage(cId, imgId) {
  const { data } = await api.post(`/categories/${cId}/images/${imgId}/evaluate`);
  return data;
}
