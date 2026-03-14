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
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="login" options={{ title: 'SaludDeUna' }} />
      <Stack.Screen name="register" options={{ title: 'Crear cuenta' }} />
    </Stack>
  );
}