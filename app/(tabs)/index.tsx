import { useRouter } from 'expo-router';

import { PatientHomeScreen } from '@/src/features/patient-home/patient-home-screen';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <PatientHomeScreen
      onLoginPress={() => router.push('/(auth)/login')}
      onRegisterPress={() => router.push('/(auth)/register')}
      onStartTriagePress={() => router.push('/triage/specialty' as any)}
      onContinueTriagePress={(sessionId) => router.push(`/triage/${sessionId}` as any)}
      onGoToChatPress={(consultationId) => router.push(`/triage/chat/${consultationId}` as any)}
      onOpenFollowupPress={(followupId) => router.push(`/followup/${followupId}` as any)}
      onOpenHistoryPress={() => router.push('/(tabs)/history' as any)}
      onOpenNotificationsPress={() => router.push('/(tabs)/notifications' as any)}
      onOpenProfilePress={() => router.push('/(tabs)/profile' as any)}
    />
  );
}
