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

// POST /auth/register  body { name (2-100), email, password (8-128) }
// -> 201 { id, name, email, is_active }.  409 "Email already registered" if the email is taken.
export async function register(name, email, password) {
  const { data } = await api.post("/auth/register", { name, email, password });
  return data;
}
