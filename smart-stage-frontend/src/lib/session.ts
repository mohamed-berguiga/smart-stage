/**
 * Gestion de la session utilisateur avec vraie authentification JWT.
 *
 * À placer dans : src/lib/session.ts (remplace le fichier existant)
 */
import { useEffect, useState } from "react";
import { api, setToken, clearToken, getToken, ApiError } from "./api";

export type Role = "RH" | "ENCADRANT" | "STAGIAIRE";

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  department?: { id: string; name: string } | null;
};

const USER_KEY = "smart-stage-user";

// sessionStorage : voir la note dans api.ts (isolation par onglet).
function saveUser(user: SessionUser) {
  if (typeof window !== "undefined") window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

function readUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

function clearUser() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(USER_KEY);
}

export async function login(email: string, password: string): Promise<SessionUser> {
  const data = await api.post<{ token: string; user: SessionUser }>("/auth/login", {
    email,
    password,
  });
  setToken(data.token);
  saveUser(data.user);
  return data.user;
}

export function logout() {
  clearToken();
  clearUser();
}

export function getSession(): SessionUser | null {
  if (!getToken()) return null;
  return readUser();
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(getSession());
    setReady(true);
  }, []);

  return {
    user,
    role: user?.role ?? null,
    ready,
    isAuthenticated: !!user,
  };
}

export { ApiError };