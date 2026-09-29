import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  root: ".",
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT || 22889),
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    port: Number(process.env.PORT || 22889),
    allowedHosts: true,
  },
});