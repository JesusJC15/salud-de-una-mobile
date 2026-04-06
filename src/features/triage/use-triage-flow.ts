import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { triageApiService } from '@/src/services/triage/triage-api';
import { CreateTriageSessionInput, TriageAnswerSubmissionInput } from '@/src/types/triage';

export const triageQueryKeys = {
  all: ['triage'] as const,
  result: (sessionId: string) => [...triageQueryKeys.all, 'result', sessionId] as const,
  session: (sessionId: string) => [...triageQueryKeys.all, 'session', sessionId] as const,
};

export function useTriageSessionQuery(sessionId: string, enabled = true) {
  return useQuery({
    enabled: Boolean(sessionId) && enabled,
    queryFn: () => triageApiService.getTriageSession(sessionId),
    queryKey: triageQueryKeys.session(sessionId),
    staleTime: 10_000,
  });
}

export function useTriageResultQuery(sessionId: string, enabled = true) {
  return useQuery({
    enabled: Boolean(sessionId) && enabled,
    queryFn: () => triageApiService.getTriageResult(sessionId),
    queryKey: triageQueryKeys.result(sessionId),
    staleTime: 10_000,
  });
}

export function useCreateTriageSessionMutation() {
  return useMutation({
    mutationFn: (input: CreateTriageSessionInput) => triageApiService.createTriageSession(input),
  });
}

export function useSubmitTriageAnswerMutation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TriageAnswerSubmissionInput) => triageApiService.submitTriageAnswer(sessionId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: triageQueryKeys.session(sessionId) });
    },
  });
}

export function useAnalyzeTriageSessionMutation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => triageApiService.analyzeTriageSession(sessionId),
    onSuccess: async (result) => {
      queryClient.setQueryData(triageQueryKeys.result(sessionId), result);
      await queryClient.invalidateQueries({ queryKey: triageQueryKeys.session(sessionId) });
    },
  });
}
