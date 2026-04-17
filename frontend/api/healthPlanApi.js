import { apiRequest } from "./client";

/**
 * Generate a health plan from onboarding answers
 */
export const generateHealthPlan = (token, data) => {
  return apiRequest("/health-plan/generate", {
    method: "POST",
    token,
    body: data,
  });
};

/**
 * Get existing health plan for user
 */
export const getHealthPlan = (token) => {
  return apiRequest("/health-plan", {
    method: "GET",
    token,
  });
};

/**
 * Update health plan (optional)
 */
export const updateHealthPlan = (token, data) => {
  return apiRequest("/health-plan", {
    method: "PUT",
    token,
    body: data,
  });
};
