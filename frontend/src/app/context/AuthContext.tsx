/**
 * context/AuthContext.tsx
 *
 * Provides the logged-in user object and auth helpers to the whole app.
 * Token is held in memory via api.ts (setToken) — never in localStorage.
 */
import React, { createContext, useContext, useState, ReactNode } from "react";
import { setToken } from "../lib/api";

export interface AuthUser {
  username: string;
  email: string;
  user_id: string;
  access_token: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (userData: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (userData: AuthUser) => {
    setToken(userData.access_token);
    setUser(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}