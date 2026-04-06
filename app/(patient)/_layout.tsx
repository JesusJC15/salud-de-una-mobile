import { Redirect, Stack } from 'expo-router';

import { useSessionStore } from '@/src/store/session-store';

export default function PatientLayout() {
  const sessionStatus = useSessionStore((state) => state.status);

  if (sessionStatus === 'anonymous') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: 'transparent',
        },
        headerShown: false,
        headerShadowVisible: false,
      }}
    />
  );
}
