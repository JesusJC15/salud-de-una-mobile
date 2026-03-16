import { Redirect, Stack } from 'expo-router';

import { useSessionStore } from '@/src/store/session-store';

export default function AuthLayout() {
  const sessionStatus = useSessionStore((state) => state.status);

  if (sessionStatus === 'authenticated') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: 'transparent',
        },
        headerShown: false,
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}