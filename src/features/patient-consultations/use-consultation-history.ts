import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { consultationHistoryService } from './consultation-history-service';

export function useConsultationHistory(page = 1, status?: string) {
  return useQuery({
    queryKey: ['patient', 'consultation-history', page, status],
    queryFn: () => consultationHistoryService.getMyHistory({ page, limit: 20, status }),
    staleTime: 30_000,
  });
}

export function useRateConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      consultationId,
      rating,
      ratingComment,
    }: {
      consultationId: string;
      rating: number;
      ratingComment?: string;
    }) => consultationHistoryService.rateConsultation(consultationId, rating, ratingComment),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['patient', 'consultation-history'] });
    },
  });
}
