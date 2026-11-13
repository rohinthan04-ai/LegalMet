import { useCallback, useEffect, useMemo, useState } from "react";
import { login as loginRequest, getProfile } from "../api/auth";
import { tokenStore } from "../api/axios";
import { AuthContext } from "./authContextObject";
import { clearAllLocalData } from "../utils/storage";

// AuthProvider keeps "who is logged in" and shares it with every component without passing props around.
// Components read it through the useAuth() hook (src/hooks/useAuth.js).

export function AuthProvider({ children }) {
  const [inspector, setInspector] = useState(null); // { id, name, email, is_active } or null
  // True while we check a saved token on first load, so we don't flash the login page.
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  // 1. Restore the session on page refresh: if a token is saved, ask the backend who it belongs to.
  useEffect(() => {
    if (!tokenStore.get()) return;

    getProfile()
      .then(setInspector)
      .catch(() => tokenStore.clear()) // expired or invalid token
      .finally(() => setLoading(false));
  }, []);

  // 2. The Axios interceptor fires this event on any 401 (e.g. the 30-minute token expired).
  useEffect(() => {
    const handleUnauthorized = () => {
      clearAllLocalData();
      setInspector(null);
    };
    window.addEventListener("legalmet:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("legalmet:unauthorized", handleUnauthorized);
  }, []);

  // Log in: get a token, save it, then load the inspector's profile.
  // Errors are thrown so the Login page can show them.
  const login = useCallback(async (email, password) => {
    const { access_token } = await loginRequest(email, password);
    tokenStore.set(access_token);
    try {
      setInspector(await getProfile());
    } catch (error) {
      tokenStore.clear();
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    clearAllLocalData();
    setInspector(null);
  }, []);

  const value = useMemo(
    () => ({ inspector, loading, isAuthenticated: Boolean(inspector), login, logout }),
    [inspector, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
