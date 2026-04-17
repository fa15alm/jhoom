/*
 * AI coach API functions.
 *
 * The AI screen should send the user's question plus relevant plan/log context
 * through this module. Keeping the AI calls here makes it easier to change
 * model/backend details without touching UI code.
 */
import { apiRequest, getAuthHeaders } from "./client";

export function askHealthCoach(token, payload) {
  // Expected payload: { message, plan, recentLogs } or a similar backend-owned shape.
  return apiRequest("/coach/chat", {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function getRecommendations(token) {
  // Pulls plan-derived recommendations for the recommendations screen.
  return apiRequest("/coach/recommendations", {
    headers: getAuthHeaders(token),
  });
}
