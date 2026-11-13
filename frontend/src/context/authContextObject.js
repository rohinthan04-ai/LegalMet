import { createContext } from "react";

// The context object lives in its own file so AuthContext.jsx exports only a component.
// Components never use this directly; they call the useAuth() hook.
export const AuthContext = createContext(null);
