import axios from "axios";
import { notify } from "@/lib/notify";
import { extractErrorMessage } from "@/lib/errors";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://peerspace-aiyh.onrender.com',
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Lazily resolved Echo instance — set by echo.ts after it initialises.
// This avoids a circular import between axios.ts and echo.ts.
let _getSocketId: (() => string | null) | null = null;

export function registerSocketIdResolver(fn: () => string | null) {
  _getSocketId = fn;
}

api.interceptors.request.use((config) => {
  // Manually read XSRF-TOKEN cookie because Axios drops it for cross-port requests
  const xsrfToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];

  if (xsrfToken) {
    config.headers["X-XSRF-TOKEN"] = decodeURIComponent(xsrfToken);
  }

  // Required for broadcast()->toOthers() — tells Laravel which socket to exclude
  // so the sender doesn't receive their own message back via WebSocket.
  const socketId = _getSocketId?.();
  if (socketId) {
    config.headers["X-Socket-ID"] = socketId;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (
        window.location.pathname !== "/auth" &&
        window.location.pathname !== "/"
      ) {
        window.location.href = "/auth";
      }
    }

    try {
      const msg = extractErrorMessage(error);
      if (error.response?.status !== 422 && error.response?.status !== 401) {
        notify.error(msg);
      }
    } catch (e) {
      // ignore toast errors
    }

    return Promise.reject(error);
  },
);

export default api;