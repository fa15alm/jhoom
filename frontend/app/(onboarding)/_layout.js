/*
 * Onboarding route group layout.
 *
 * Keeps onboarding screens under `(onboarding)` and hides the native header.
 * The carousel route owns its own layout so it matches the landing-page style.
 */
import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="basic-info" />
    </Stack>
  );
}
