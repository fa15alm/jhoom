/*
 * Shared API client.
 *
 * All backend requests should flow through this file so base URLs, auth headers,
 * JSON parsing, and error handling stay consistent across the frontend. Screens
 * should import feature API functions rather than calling `fetch` directly.
 */
const DEFAULT_API_URL = "http://localhost:5000/api";

export function getApiBaseUrl() {
  // Expo exposes public env vars via EXPO_PUBLIC_*.
  // Keep localhost as the fallback so local development works without a .env file.
  return process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
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
  // Only attach JSON content type when a body exists, so GET requests stay clean.
  // Callers can still pass extra headers, such as Authorization, in options.headers.
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    ...options,
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
