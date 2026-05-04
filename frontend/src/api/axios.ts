import axios from "axios";
import { notify } from "@/lib/notify";
import { extractErrorMessage } from "@/lib/errors";

const api = axios.create({
  baseURL: `http://${window.location.hostname}:8000`,
  withCredentials: true, // Required for Sanctum cookies
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  // Manually read XSRF-TOKEN cookie because Axios drops it for cross-port requests
  const xsrfToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];

  if (xsrfToken) {
    config.headers["X-XSRF-TOKEN"] = decodeURIComponent(xsrfToken);
  }

  // Token logic removed. Relying strictly on cookies.
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If they are not already on auth page, redirect them
      if (
        window.location.pathname !== "/auth" &&
        window.location.pathname !== "/"
      ) {
        window.location.href = "/auth";
      }
    }

    // For other errors, show a non-blocking toast with a helpful message
    try {
      const msg = extractErrorMessage(error);
      // Avoid spamming toasts for expected 422 validation on form pages (caller may handle)
      if (error.response?.status !== 422) {
        notify.error(msg);
      }
    } catch (e) {
      // ignore toast errors
    }

    return Promise.reject(error);
  },
);

export default api;
