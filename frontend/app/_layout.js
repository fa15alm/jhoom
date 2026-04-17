/*
 * Root Expo Router stack.
 *
 * Every top-level route group/screen is registered here. Headers are hidden
 * because the app uses custom mobile-first headers inside each screen instead
 * of the native stack header.
 */
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="log" />
      <Stack.Screen name="milestones" />
      <Stack.Screen name="ai" />
      <Stack.Screen name="recommendations" />
      <Stack.Screen name="social" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
