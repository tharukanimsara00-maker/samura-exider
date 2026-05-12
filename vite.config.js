// Developer: AKARSHANA
// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  server: {
    port: 3000,
    open: true,
  },

  build: {
    outDir: "dist",
    sourcemap: false,

    // PERF FIX: split the bundle into logical chunks so users only
    // download what they actually need on first visit.
    rollupOptions: {
      output: {
        manualChunks: {
          // React + router — always needed, cache forever
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Firebase SDK — large; isolate so it can be cached independently
          "vendor-firebase": ["firebase/app", "firebase/auth", "firebase/firestore"],
          // Animation lib — heavy; shared across many pages
          "vendor-motion": ["framer-motion"],
          // Icon set — only render-time cost, isolate for caching
          "vendor-icons": ["react-icons"],
        },
      },
    },

    // Raise the warning threshold a little — our vendor chunks are intentionally large
    chunkSizeWarningLimit: 600,
  },
});
