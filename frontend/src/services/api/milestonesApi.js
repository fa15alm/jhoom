/*
 * Milestones API functions.
 *
 * The milestones screen uses these to persist goals. Progress can eventually
 * be calculated by the backend from logs, health integrations, and AI targets.
 */
import { apiRequest, getAuthHeaders } from "./client";

export function getMilestones(token) {
  // Fetches all current goals for the logged-in user.
  return apiRequest("/milestones", {
    headers: getAuthHeaders(token),
  });
}

export function createMilestone(token, payload) {
  // Creates a new target/goal from the milestones form.
  return apiRequest("/milestones", {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function updateMilestone(token, milestoneId, payload) {
  // Updates title, target, date, category, or manual completion state.
  return apiRequest(`/milestones/${milestoneId}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function deleteMilestone(token, milestoneId) {
  // Removes a goal from the user's active milestones.
  return apiRequest(`/milestones/${milestoneId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
}
