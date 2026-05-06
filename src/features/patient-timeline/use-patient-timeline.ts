import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '@/src/store/session-store';
import { followupService } from '@/src/features/patient-followup/followup-service';

export function usePatientTimeline() {
  const profile = useSessionStore((state) => state.profile);
  const session = useSessionStore((state) => state.session);
  const patientId = profile?.id ?? session?.user.id ?? null;

  return useQuery({
    queryKey: ['patient', 'timeline', patientId],
    queryFn: () => followupService.getTimeline(patientId!),
    enabled: !!patientId,
    staleTime: 30_000,
  });
}
