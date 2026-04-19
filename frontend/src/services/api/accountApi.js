import { apiRequest, getAuthHeaders } from "./client";

export function exportAccountData(token) {
  return apiRequest("/account/export", {
    headers: getAuthHeaders(token),
  });
}

export function deleteAccount(token, password) {
  return apiRequest("/account/me", {
    method: "DELETE",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ password }),
  });
}
