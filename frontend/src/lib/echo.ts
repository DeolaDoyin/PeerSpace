import Echo from "laravel-echo";
import Pusher from "pusher-js";

import api from "@/api/axios";

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

let echo: Echo<"reverb"> | null = null;

export function getEcho(): Echo<"reverb"> | null {
  const key = import.meta.env.VITE_REVERB_APP_KEY;
  if (!key) {
    return null;
  }

  if (!echo) {
    window.Pusher = Pusher;

    const scheme = import.meta.env.VITE_REVERB_SCHEME ?? "http";
    const port = Number(import.meta.env.VITE_REVERB_PORT ?? 8080);
    const host =
      import.meta.env.VITE_REVERB_HOST ?? window.location.hostname;

    // 💡 Resolve the clean auth path explicitly
    // This points to http://localhost:8000/broadcasting/auth if your baseURL is http://localhost:8000/api
    const cleanAuthUrl = `${api.defaults.baseURL?.replace(/\/api\/?$/, "")}/broadcasting/auth`;

    echo = new Echo<"reverb">({
      broadcaster: "reverb",
      key,
      wsHost: host,
      wsPort: port,
      wssPort: port,
      forceTLS: scheme === "https",
      enabledTransports: ["ws", "wss"],
      authEndpoint: cleanAuthUrl,
      authorizer: (channel) => ({
        authorize: (socketId, callback) => {
          api
            // 💡 1. Use the explicit clean auth URL path matching Laravel's Channels routing
            .post(cleanAuthUrl, {
              socket_id: socketId,
              channel_name: channel.name,
            }, {
              // 💡 2. Enforce credentials sharing so cookies/tokens cross domains securely
              withCredentials: true 
            })
            .then((response) => {
              callback(null, response.data as never);
            })
            .catch((error: unknown) => {
              callback(
                error instanceof Error ? error : new Error(String(error)),
                null
              );
            });
        },
      }),
    });
  }

  return echo;
}

export function disconnectEcho(): void {
  if (echo) {
    echo.disconnect();
    echo = null;
  }
}