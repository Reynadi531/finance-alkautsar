import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

// Vercel builds and runs in separate environments with no .env files at runtime, so bake
// the resolved (encrypted) env into the bundle there; Docker/Node loads it on boot instead.
const onVercel = Boolean(process.env.VERCEL);

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    varlockVitePlugin({ ssrInjectMode: onVercel ? "resolved-env" : "auto-load" }),
    tailwindcss(),
    tanstackStart(),
    nitro({ preset: onVercel ? "vercel" : "node-server" }),
    viteReact(),
  ],
});
