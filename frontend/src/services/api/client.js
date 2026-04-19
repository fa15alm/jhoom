/*
 * Shared API client.
 *
 * All backend requests should flow through this file so base URLs, auth headers,
 * JSON parsing, and error handling stay consistent across the frontend. Screens
 * should import feature API functions rather than calling `fetch` directly.
 */
const DEFAULT_API_URL = "http://localhost:5001/api";

function getBrowserApiUrl() {
  if (typeof window === "undefined" || !window.location?.hostname) {
    return DEFAULT_API_URL;
  }

  if (window.location.port === "8081") {
    return `${window.location.protocol}//${window.location.hostname}:5001/api`;
  }

  if (window.location.hostname === "localhost" && window.location.port !== "5001") {
    return DEFAULT_API_URL;
  }

  if (window.location.hostname === "127.0.0.1" && window.location.port !== "5001") {
    return "http://127.0.0.1:5001/api";
  }

  if (window.location.origin) {
    return `${window.location.origin}/api`;
  }

  return `${window.location.protocol}//${window.location.hostname}:5001/api`;
}

export function getApiBaseUrl() {
  // Expo exposes public env vars via EXPO_PUBLIC_*.
  // Web falls back to the current browser hostname so phones on the LAN call
  // the laptop backend instead of trying their own localhost.
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || getBrowserApiUrl();
  return baseUrl.replace(/\/$/, "");
}

export function resolveApiAssetUrl(url) {
  if (!url || /^https?:\/\//i.test(url) || String(url).startsWith("data:")) {
    return url;
  }

  const apiBaseUrl = getApiBaseUrl();
  const apiOrigin = apiBaseUrl.replace(/\/api$/, "");
  return `${apiOrigin}${String(url).startsWith("/") ? url : `/${url}`}`;
}

export function getAuthHeaders(token) {
  // Authenticated endpoints can spread these headers into apiRequest options.
  // Returning an empty object keeps public calls clean when no token exists.
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function apiRequest(path, options = {}) {
  const hasBody = Boolean(options.body);
  const requestPath = path.startsWith("/") ? path : `/${path}`;
  const { headers, ...requestOptions } = options;
  // Only attach JSON content type when a body exists, so GET requests stay clean.
  // Callers can still pass extra headers, such as Authorization, in options.headers.
  const response = await fetch(`${getApiBaseUrl()}${requestPath}`, {
    ...requestOptions,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  });

  // Some endpoints may return no body, so JSON parsing is intentionally safe.
  // This prevents DELETE/204 responses from crashing the frontend.
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Standardise backend failures into thrown Errors that screens can catch
    // and display as friendly validation/status messages.
    throw new Error(data?.error ?? data?.message ?? "API request failed");
  }

  return data;
}
