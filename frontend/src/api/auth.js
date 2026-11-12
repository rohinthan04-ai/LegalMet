import api from "./axios";

// POST /auth/login  (JSON body, NOT form data)  ->  { access_token, token_type }
export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

// GET /auth/me  ->  { id, name, email, is_active }
export async function getProfile() {
  const { data } = await api.get("/auth/me");
  return data;
}
