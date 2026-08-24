import { io, type Socket } from "socket.io-client";
import { getToken } from "./api";

let socket: Socket | null = null;

// Même origine que l'API, sans le suffixe "/api"
const SOCKET_URL = (import.meta.env["VITE_API_URL"] || "http://localhost:8000/api").replace(
  /\/api\/?$/,
  "",
);

/**
 * Établit (ou réutilise) la connexion Socket.io, authentifiée avec le même
 * token JWT que les appels API REST. Renvoie null si l'utilisateur n'est
 * pas connecté (pas de token disponible).
 */
export function connectSocket(): Socket | null {
  const token = getToken();
  if (!token) return null;

  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}