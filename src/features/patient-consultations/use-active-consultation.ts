import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '@/src/store/session-store';
import { useTriageStore } from '@/src/store/triage-store';
import { consultationHistoryService } from './consultation-history-service';
import type { ConsultationHistoryItem } from './consultation-history-service';

export function findActiveConsultation(items: ConsultationHistoryItem[]): ConsultationHistoryItem | null {
  // Prefer IN_ATTENTION (doctor already assigned) over PENDING
  return (
    items.find((c) => c.status === 'IN_ATTENTION') ??
    items.find((c) => c.status === 'PENDING') ??
    null
  );
}

/**
 * Fetches the most recent non-closed consultation from the backend.
 * Fetches up to 5 items so we don't miss an active consultation buried
 * behind a recently-closed one. Syncs consultationId into the triage store.
 */
export function useActiveConsultation() {
  const isAuthenticated = useSessionStore((s) => s.status === 'authenticated');
  const setConsultationId = useTriageStore((s) => s.setConsultationId);

  return useQuery({
    queryKey: ['patient', 'active-consultation'],
    queryFn: async () => {
      const res = await consultationHistoryService.getMyHistory({ limit: 5 });
      const active = findActiveConsultation(res.items);
      if (active) {
        setConsultationId(active.id);
        return active;
      }
      setConsultationId(null);
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
