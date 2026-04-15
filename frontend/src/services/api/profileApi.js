/*
 * Profile API functions.
 *
 * Settings should hydrate/update the current user's profile here. Social
 * screens can use public profile lookup when viewing friends.
 */
import { apiRequest, getAuthHeaders } from "./client";

export function getMyProfile(token) {
  // Fetch the logged-in user's editable settings/profile details.
  return apiRequest("/profile/me", {
    headers: getAuthHeaders(token),
  });
}

export function updateMyProfile(token, payload) {
  // Save profile edits, preferences, privacy controls, and photo metadata.
  return apiRequest("/profile/me", {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function getUserProfile(userId) {
  // Public/friend profile lookup. This may not need auth depending on privacy rules.
  return apiRequest(`/profile/${userId}`);
}
