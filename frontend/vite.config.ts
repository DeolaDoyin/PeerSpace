import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("node_modules/react") ||
              id.includes("node_modules/react-dom")
            )
              return "vendor-react";
            if (
              id.includes("node_modules/@tanstack") ||
              id.includes("node_modules/react-query")
            )
              return "vendor-query";
            if (
              id.includes("node_modules/react-router") ||
              id.includes("node_modules/history")
            )
              return "vendor-router";
            if (id.includes("node_modules/lucide-react")) return "vendor-icons";
            if (id.includes("node_modules/date-fns")) return "vendor-date-fns";
            if (id.includes("node_modules/sonner")) return "vendor-sonner";
            if (id.includes("node_modules/framer-motion"))
              return "vendor-framer";
            if (id.includes("node_modules/pusher-js")) return "vendor-pusher";
            if (id.includes("node_modules/laravel-echo")) return "vendor-echo";
            return "vendor";
          }
        },
      },
    },
  },
});
