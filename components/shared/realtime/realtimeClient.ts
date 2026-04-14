"use client";

import { io, type Socket } from "socket.io-client";

function trimSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function resolveSocketBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "";
  if (!raw) return "";
  const normalized = trimSlash(raw);
  return normalized.endsWith("/api") ? normalized.slice(0, -4) : normalized;
}

const SOCKET_BASE_URL = resolveSocketBaseUrl();
const SOCKET_PATH = process.env.NEXT_PUBLIC_SOCKET_PATH || "/socket.io";

let activeSocket: Socket | null = null;
let activeToken: string | null = null;

export function getRealtimeSocket(token: string) {
  if (!SOCKET_BASE_URL || !token || typeof window === "undefined") return null;
  if (activeSocket && activeToken === token) return activeSocket;

  if (activeSocket) {
    activeSocket.disconnect();
    activeSocket = null;
    activeToken = null;
  }

  activeToken = token;
  activeSocket = io(SOCKET_BASE_URL, {
    path: SOCKET_PATH,
    transports: ["websocket", "polling"],
    withCredentials: true,
    auth: { token: `Bearer ${token}` },
  });

  return activeSocket;
}

