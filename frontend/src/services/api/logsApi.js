/*
 * Log API functions.
 *
 * The log screen should use this module for CRUD operations. Dashboard,
 * milestones, AI coach, and settings can also read logs through this same
 * contract so every screen agrees on the log data shape.
 */
import { apiRequest, getAuthHeaders } from "./client";

export function getLogs(token, params = {}) {
  // Params support date/month filters without each screen building query strings.
  // Example: getLogs(token, { date: "2026-04-15" }).
  const searchParams = new URLSearchParams(params).toString();
  const query = searchParams ? `?${searchParams}` : "";

  return apiRequest(`/logs${query}`, {
    headers: getAuthHeaders(token),
  });
}

export function createLog(token, payload) {
  // Creates one user-entered or integration-imported health log.
  return apiRequest("/logs", {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function updateLog(token, logId, payload) {
  // Edits an existing log from the log history/editor UI.
  return apiRequest(`/logs/${logId}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function deleteLog(token, logId) {
  // Deletes one saved log after user confirmation.
  return apiRequest(`/logs/${logId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}
