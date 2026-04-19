import { apiRequest, getAuthHeaders } from "./client";

export function uploadProfilePhoto(token, payload) {
  return apiRequest("/uploads/profile-photo", {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function uploadSocialPostImage(token, payload) {
  return apiRequest("/uploads/social-post-image", {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
}
