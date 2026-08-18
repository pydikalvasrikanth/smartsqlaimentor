/**
 * Central site / origin configuration.
 *
 * CANONICAL_SITE_URL — the production origin used for canonical tags, sitemap
 * entries and any server-side absolute URL. Overridable per environment with
 * VITE_SITE_URL (public, safe to ship to the browser).
 *
 * getAuthOrigin() — the origin auth redirects must use. In the Lovable
 * `id-preview--*` iframe the visible origin is not an allowed redirect target,
 * so we fall back to the stable dev project origin.
 */
const FALLBACK_SITE_URL = "https://smartsqlaimentor.live";

const DEV_PROJECT_ORIGIN =
  "https://project--93a75156-6283-48bf-a62b-5aa287cea47b-dev.lovable.app";

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

export const CANONICAL_SITE_URL = trimTrailingSlash(
  (import.meta.env["VITE_SITE_URL"] as string | undefined)?.trim() || FALLBACK_SITE_URL,
);

export function canonicalUrl(path = "/") {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${CANONICAL_SITE_URL}${suffix === "/" ? "" : suffix}`;
}

export function getAuthOrigin() {
  if (typeof window === "undefined") return CANONICAL_SITE_URL;
  const { hostname, origin } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") return origin;
  if (hostname.startsWith("id-preview--") && hostname.endsWith(".lovable.app")) {
    return DEV_PROJECT_ORIGIN;
  }
  return origin;
}

export function getAuthRedirect(path = "/") {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${getAuthOrigin()}${suffix}`;
}
