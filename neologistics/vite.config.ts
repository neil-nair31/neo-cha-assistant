import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Local API wiring (monorepo):
 *   Assist  → :8787  /api/assistant/*
 *   HS      → :8790  /api/hs/*     → /api/*
 *   Digests → :8791  /api/notifications/*
 *   Portal  → :8792  /api/portal/* → /api/*  (optional)
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    allowedHosts: [".trycloudflare.com", "localhost"],
    proxy: {
      "/api/assistant": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
      "/api/hs": {
        target: "http://localhost:8790",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hs/, "/api"),
      },
      "/api/notifications": {
        target: "http://localhost:8791",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/notifications/, "/api"),
      },
      "/api/portal": {
        target: "http://localhost:8792",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/portal/, "/api"),
      },
    },
  },
});
