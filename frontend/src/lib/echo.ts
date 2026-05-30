import Echo from "laravel-echo";
import Pusher from "pusher-js";

import api, { registerSocketIdResolver } from "@/api/axios";

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
            .post(cleanAuthUrl, {
              socket_id: socketId,
              channel_name: channel.name,
            }, {
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

    // Register the socket ID resolver so axios can attach X-Socket-ID to
    // every outgoing request, enabling broadcast()->toOthers() in Laravel
    // to correctly exclude the sender from receiving their own broadcast.
    registerSocketIdResolver(() => echo?.socketId() ?? null);
  }

  return echo;
}

export function disconnectEcho(): void {
  if (echo) {
    echo.disconnect();
    echo = null;
  }
}