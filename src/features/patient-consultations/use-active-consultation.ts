import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '@/src/store/session-store';
import { useTriageStore } from '@/src/store/triage-store';
import { consultationHistoryService } from './consultation-history-service';

/**
 * Fetches the most recent non-closed consultation from the backend.
 * Syncs the consultationId into the triage store so it persists
 * across app restarts.
 */
export function useActiveConsultation() {
  const isAuthenticated = useSessionStore((s) => s.status === 'authenticated');
  const setConsultationId = useTriageStore((s) => s.setConsultationId);

  return useQuery({
    queryKey: ['patient', 'active-consultation'],
    queryFn: async () => {
      const res = await consultationHistoryService.getMyHistory({ limit: 1 });
      const latest = res.items[0] ?? null;
      if (latest && latest.status !== 'CLOSED') {
        setConsultationId(latest.id);
        return latest;
      }
      return null;
    },
    enabled: isAuthenticated,
    staleTime: 10_000,
    refetchInterval: (query) => {
      const consultation = query.state.data;
      return consultation?.status === 'PENDING' ? 10_000 : 30_000;
    },
  });
}
