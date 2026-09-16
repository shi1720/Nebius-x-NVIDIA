import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiOrigin = process.env.VITE_API_ORIGIN || env.VITE_API_ORIGIN;
  if (command === "build") {
    if (!apiOrigin || new URL(apiOrigin).protocol !== "https:") {
      throw new Error(
        "Set VITE_API_ORIGIN to the HTTPS API origin before building Firebase Hosting. Use npm run deploy for the configured release.",
      );
    }
  }
  return {
    plugins: [react()],
    resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
    build: { outDir: "dist/firebase" },
    server: { port: 5173, host: "127.0.0.1" },
  };
});
