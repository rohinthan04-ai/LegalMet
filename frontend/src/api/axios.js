// Shared Axios instance. Every API file imports `api` from here,
// so the base URL and the JWT header are configured in exactly one place.
import axios from "axios";

const TOKEN_KEY = "legalmet_token";

// Small helpers so no other file touches localStorage directly.
// NOTE (prototype only): localStorage can be read by any script running on the page,
// so an XSS bug would leak the token. Production apps usually use httpOnly cookies.
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  // Gemini calls (/analyze, /evaluate) can take a while, so allow 2 minutes.
  timeout: 120000,
});

// Before every request: attach "Authorization: Bearer <token>" (the backend uses HTTPBearer).
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// After every response: if the backend says 401 (token missing/expired - default lifetime is 30 min),
// clear the token and tell the app. AuthContext listens for this event and redirects to /login.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Requests made with responseType "blob" (PDF, image) also get their ERROR body as a Blob.
    // Turn it back into JSON so getErrorMessage() can read FastAPI's { detail: "..." }.
    const body = error.response?.data;
    if (body instanceof Blob && body.type.includes("json")) {
      try {
        error.response.data = JSON.parse(await body.text());
      } catch {
        /* leave it as it is */
      }
    }

    const isLoginRequest = error.config?.url === "/auth/login";
    if (error.response?.status === 401 && !isLoginRequest) {
      tokenStore.clear();
      window.dispatchEvent(new Event("legalmet:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export default api;
