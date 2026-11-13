// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [VitePWA({
      strategies: "generateSW",
      filename: "sw.js",
      manifest: false,
      injectRegister: null,
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      includeAssets: ["offline.html", "manifest.json", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "favicon.ico"],
      workbox: {
        globPatterns: ["**/*.{js,css,woff,woff2}"],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        runtimeCaching: [{
          urlPattern: ({ request, url }) => request.mode === "navigate" && url.origin === self.location.origin && !/^\/(?:auth|reset-password|~oauth|api)(?:\/|$)/.test(url.pathname),
          handler: "NetworkFirst",
          options: {
            // HTML is network-only in practice: never persist private responses.
            cacheName: "butacapp-navigation",
            cacheableResponse: { statuses: [] },
            precacheFallback: { fallbackURL: "/offline.html" },
          },
        }],
      },
    })],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
