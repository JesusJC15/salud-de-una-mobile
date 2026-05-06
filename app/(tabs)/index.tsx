import { useRouter } from 'expo-router';

import { PatientHomeScreen } from '@/src/features/patient-home/patient-home-screen';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <PatientHomeScreen
      onLoginPress={() => router.push('/(auth)/login')}
      onRegisterPress={() => router.push('/(auth)/register')}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onStartTriagePress={() => router.push('/triage/specialty' as any)}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onContinueTriagePress={(sessionId) => router.push(`/triage/${sessionId}` as any)}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onGoToChatPress={(consultationId) => router.push(`/triage/chat/${consultationId}` as any)}
    />
  );
}
