// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://cdn.gpteng.co https://lovable.dev",
  "connect-src 'self' https: wss:",
  "worker-src 'self' blob:",
  "form-action 'self'",
].join("; ");

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Nitro route rules to ensure static files and redirects also get security headers.
  nitro: {
    routeRules: {
      "/**": {
        headers: {
          "X-Frame-Options": "SAMEORIGIN",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "Permissions-Policy": "geolocation=(), camera=(), payment=()",
          "Content-Security-Policy": CSP,
        },
      },
    },
  },
});
