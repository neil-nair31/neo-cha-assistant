import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** IIFE drop-in bundle for Django / any host page */
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: "src/embed.tsx",
      name: "NeoAssist",
      formats: ["iife"],
      fileName: () => "neo-assist.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: "neo-assist.[ext]",
        entryFileNames: "neo-assist.js",
      },
    },
    cssCodeSplit: false,
  },
});
