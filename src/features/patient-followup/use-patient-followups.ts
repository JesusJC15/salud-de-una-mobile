import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/src/store/session-store';
import { followupService } from './followup-service';

export function usePendingFollowups() {
  const authenticated = useSessionStore((state) => state.status === 'authenticated');

  return useQuery({
    queryKey: ['patient', 'followups', 'pending'],
    queryFn: () => followupService.listMine(),
    enabled: authenticated,
    staleTime: 30_000,
    refetchInterval: 30_000,
    select: (data) => ({
      items: data.items.filter(item => item.status === 'PENDING' || item.status === 'REMINDED'),
    }),
  });
}

export function useFollowup(followupId: string) {
  return useQuery({
    queryKey: ['patient', 'followup', followupId],
    queryFn: () => followupService.getById(followupId),
    enabled: !!followupId,
    staleTime: 30_000,
  });
}

export function useSubmitFollowup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: followupService.submit,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['patient', 'followups'] }),
        queryClient.invalidateQueries({ queryKey: ['patient', 'consultation-history'] }),
        queryClient.invalidateQueries({ queryKey: ['patient', 'timeline'] }),
      ]);
    },
  });
}
