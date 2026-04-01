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

    echo = new Echo<"reverb">({
      broadcaster: "reverb",
      key,
      wsHost: host,
      wsPort: port,
      wssPort: port,
      forceTLS: scheme === "https",
      enabledTransports: ["ws", "wss"],
      authEndpoint: `${api.defaults.baseURL}/broadcasting/auth`,
      authorizer: (channel) => ({
        authorize: (socketId, callback) => {
          api
            .post("/broadcasting/auth", {
              socket_id: socketId,
              channel_name: channel.name,
            })
            .then((response) => {
              // Laravel /broadcasting/auth returns Pusher-compatible JSON (auth + optional channel_data).
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
