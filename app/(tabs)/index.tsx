import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { PatientHomeScreen } from '@/src/features/patient-home/patient-home-screen';
import { useTriageSpecialty } from '@/src/features/patient-triage/use-triage-specialty';
import { ApiError } from '@/src/services/api/api-error';
import { authService } from '@/src/services/auth/auth-service';
import { useSessionStore } from '@/src/store/session-store';
import { useTriageStore } from '@/src/store/triage-store';

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const clearSession = useSessionStore((state) => state.clearSession);
  const setActiveSession = useTriageStore((state) => state.setActiveSession);
  const { createSessionMutation } = useTriageSpecialty();

  const handleStartUrgentCare = async () => {
    const specialty = 'URGENT_CARE';

    try {
      const session = await createSessionMutation.mutateAsync(specialty);
      setActiveSession(session.sessionId, specialty);
      router.replace(`/triage/${session.sessionId}` as any);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 409) {
        const payload = (err.details as { payload?: { existingSessionId?: string } } | undefined)?.payload;
        const existingId = payload?.existingSessionId;

        if (existingId) {
          setActiveSession(existingId, specialty);
          router.replace(`/triage/${existingId}` as any);
        }
      }
    }
  };

  const handleLogout = async () => {
    const refreshToken = useSessionStore.getState().session?.refreshToken ?? null;

    setIsLoggingOut(true);

    try {
      await authService.logout(refreshToken);
    } catch {
      // Se prioriza limpiar la sesión local aunque el backend no responda.
    } finally {
      queryClient.clear();
      await clearSession();
      router.replace('/(auth)/login');
      setIsLoggingOut(false);
    }
  };

  return (
    <PatientHomeScreen
      onLoginPress={() => router.push('/(auth)/login')}
      onRegisterPress={() => router.push('/(auth)/register')}
      onStartTriagePress={() => router.push('/triage/specialty' as any)}
      onStartUrgentCarePress={() => void handleStartUrgentCare()}
      isStartingUrgentCare={createSessionMutation.isPending}
      isLoggingOut={isLoggingOut}
      onContinueTriagePress={(sessionId) => router.push(`/triage/${sessionId}` as any)}
      onGoToChatPress={(consultationId) => router.push(`/triage/chat/${consultationId}` as any)}
      onLogoutPress={() => void handleLogout()}
      onOpenFollowupPress={(followupId) => router.push(`/followup/${followupId}` as any)}
      onOpenHistoryPress={() => router.push('/(tabs)/history' as any)}
      onOpenNotificationsPress={() => router.push('/(tabs)/notifications' as any)}
      onOpenProfilePress={() => router.push('/(tabs)/profile' as any)}
    />
  );
}
