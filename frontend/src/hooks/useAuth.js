import { useContext } from "react";
import { AuthContext } from "../context/authContextObject";

// Usage in any component:  const { inspector, login, logout } = useAuth();
export default function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
