/*
 * Auth route group layout.
 *
 * Groups login and register under `(auth)` while keeping both screens full
 * screen with no native header. The custom auth layouts provide their own
 * spacing, branding, and navigation links.
 */
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
