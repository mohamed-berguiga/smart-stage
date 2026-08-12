/**
 * Client API centralisé pour Smart Stage.
 * Toutes les requêtes vers le backend Node/Express passent par ici.
 *
 * À placer dans : src/lib/api.ts
 */

const BASE_URL = import.meta.env["VITE_API_URL"] || "http://localhost:8000/api";

const TOKEN_KEY = "smart-stage-token";

// sessionStorage (et non localStorage) : la session est isolée par onglet,
// ce qui permet de tester RH/Encadrant/Stagiaire en parallèle dans 3 onglets
// différents sans qu'ils n'écrasent la session les uns des autres.
// Contrepartie : fermer l'onglet déconnecte (pas de "rester connecté" entre
// sessions de navigateur) — normal pour un environnement de test/dev.
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window !== "undefined") window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  isFormData?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, isFormData = false } = options;
  const token = getToken();

  const headers: Record<string, string> = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const init: RequestInit = {
    method,
    headers,
    ...(body !== undefined
      ? { body: isFormData ? (body as FormData) : JSON.stringify(body) }
      : {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, init);

  let data: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    if (response.status === 401) clearToken();
    throw new ApiError(data?.message || `Erreur ${response.status}`, response.status);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "POST", body: formData, isFormData: true }),
  fileUrl: (relativeUrl: string) => `${BASE_URL.replace(/\/api$/, "")}${relativeUrl}`,
};