import { apiRequest, getAuthHeaders } from "./client";

export function getDashboardSummary(token) {
  return apiRequest("/dashboard/summary", {
    headers: getAuthHeaders(token),
  });
}
