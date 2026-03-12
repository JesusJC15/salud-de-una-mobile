import { useMutation } from '@tanstack/react-query';

import { LoginInput, RegisterInput } from '@/src/schemas/auth';
import { authService } from '@/src/services/auth/auth-service';
import { useSessionStore } from '@/src/store/session-store';

export function usePatientAuth() {
  const setSession = useSessionStore((state) => state.setSession);

  async function buildAuthenticatedState(email: string, password: string) {
    const session = await authService.loginPatient({ email, password });
    const profile = await authService.getCurrentPatient();

    await setSession(session, profile);

    return { session, profile };
  }

  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) => buildAuthenticatedState(input.email, input.password),
  });

  const registerMutation = useMutation({
    mutationFn: async (input: RegisterInput) => {
      await authService.registerPatient(input);

      return buildAuthenticatedState(input.email, input.password);
    },
  });

  return {
    loginMutation,
    registerMutation,
  };
}