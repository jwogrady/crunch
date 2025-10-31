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
});

