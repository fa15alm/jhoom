/*
 * Health-plan API functions.
 *
 * Onboarding should submit answers here, and plan/AI/dashboard screens should
 * read the current generated plan from here once backend persistence exists.
 */
import { apiRequest, getAuthHeaders } from "./client";

export function getHealthPlan(token) {
  // Returns the current user's saved/generated health plan.
  return apiRequest("/health-plan", {
    headers: getAuthHeaders(token),
  });
}

export function generateHealthPlan(token, onboardingAnswers) {
  // Creates a new AI-generated plan from the onboarding carousel answers.
  return apiRequest("/health-plan/generate", {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(onboardingAnswers),
  });
}

export function updateHealthPlan(token, payload) {
  // Supports manual edits or regenerated sections after the first plan exists.
  return apiRequest("/health-plan", {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
}
