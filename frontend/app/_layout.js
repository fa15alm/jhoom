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
