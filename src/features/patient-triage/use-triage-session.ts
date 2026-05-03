import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AnswerValue } from './triage-service';
import { triageService } from './triage-service';

export function useTriageSession(sessionId: string | null) {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ['triage', 'session', sessionId],
    queryFn: () => triageService.getSessionDetail(sessionId!),
    enabled: !!sessionId,
    staleTime: 5_000,
  });

  const saveAnswersMutation = useMutation({
    mutationFn: (answers: { questionId: string; answerValue: AnswerValue }[]) =>
      triageService.saveAnswers(sessionId!, answers),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['triage', 'session', sessionId],
      });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: () => triageService.analyzeSession(sessionId!),
  });

  const cancelMutation = useMutation({
    mutationFn: () => triageService.cancelSession(sessionId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['triage'] });
    },
  });

  return {
    sessionQuery,
    saveAnswersMutation,
    analyzeMutation,
    cancelMutation,
  };
}
