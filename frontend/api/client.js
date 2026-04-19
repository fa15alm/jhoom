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

function getApiBaseUrl() {
  return (process.env.EXPO_PUBLIC_API_URL || getBrowserApiUrl()).replace(/\/$/, "");
}

export async function apiRequest(path, { method = "GET", token, body } = {}) {
  const requestPath = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${getApiBaseUrl()}${requestPath}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}
