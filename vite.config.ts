import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/optimize": "http://localhost:3000",
      "/download": "http://localhost:3000",
      "/download-all": "http://localhost:3000",
      "/api": "http://localhost:3000",
    },
  },
  root: "src/web",
  build: {
    rollupOptions: {
      external: (id) => {
        // Explicitly externalize Node.js built-in modules to prevent warnings
        return id === "path" || id.startsWith("path/") || id === "fs" || id.startsWith("node:");
      },
      output: {
        // Suppress warnings about externalized modules
        globals: {},
      },
    },
  },
});

