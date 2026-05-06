import { useMutation, useQuery } from '@tanstack/react-query';
import type { TriageSpecialty } from '@/src/schemas/triage';
import { triageService } from './triage-service';

export function useTriageSpecialty() {
  const activeSessionsQuery = useQuery({
    queryKey: ['triage', 'active'],
    queryFn: () => triageService.getActiveSessions(),
    staleTime: 10_000,
  });

  const createSessionMutation = useMutation({
    mutationFn: (specialty: TriageSpecialty) =>
      triageService.createSession(specialty),
  });

  return {
    activeSessionsQuery,
    createSessionMutation,
  };
}
