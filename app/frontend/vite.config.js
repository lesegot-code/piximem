import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

//in docker the backend is reachable as "backend", locally on localhost
const API_TARGET = process.env.API_TARGET || "http://localhost:3000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    //the browser only talks to the frontend, so the session cookie is same-origin
    proxy: {
      "/api": API_TARGET,
      "/uploads": API_TARGET,
    },
  },
});
