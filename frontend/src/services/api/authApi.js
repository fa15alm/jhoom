/*
 * Auth API functions.
 *
 * These functions define the frontend contract for login/register. Screens
 * should call these instead of building auth fetch requests themselves, which
 * keeps payload shapes and endpoint paths in one place.
 */
import { apiRequest } from "./client";

export function loginUser(payload) {
  // Expected payload: { email, password }.
  // Expected response should include enough session data to store the user token.
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerUser(payload) {
  // Expected payload: { username, email, password } plus any backend-required fields.
  // After this succeeds, the app can route into onboarding.
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
