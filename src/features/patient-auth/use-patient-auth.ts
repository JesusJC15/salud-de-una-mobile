import * as AuthSession from 'expo-auth-session';
import { useMutation } from '@tanstack/react-query';

import { appConfig } from '@/src/config/env';
import { authService } from '@/src/services/auth/auth-service';
import {
  AUTH0_DISCOVERY,
  decodeTokenClaims,
  makeAuth0RedirectUri,
  provisionPatient,
} from '@/src/services/auth/auth0-service';
import { useSessionStore } from '@/src/store/session-store';
import type { UserRole } from '@/src/types/enums';
import type { RegisterInput } from '@/src/schemas/auth';

export function usePatientAuth() {
  const setSession = useSessionStore((state) => state.setSession);
  const clearSession = useSessionStore((state) => state.clearSession);

  const redirectUri = makeAuth0RedirectUri();
  const clientId = appConfig.auth0ClientId ?? '';

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      redirectUri,
      extraParams: {
        audience: appConfig.auth0Audience ?? '',
      },
    },
    AUTH0_DISCOVERY,
  );

  async function authenticateWithAuth0(registerData?: RegisterInput) {
    const result = await promptAsync();

    if (result.type !== 'success') {
      throw new Error(result.type === 'cancel' ? 'Login cancelado' : 'Error de autenticación');
    }

    const tokenResult = await AuthSession.exchangeCodeAsync(
      {
        clientId,
        code: result.params.code,
        redirectUri,
        extraParams: { code_verifier: request!.codeVerifier! },
      },
      AUTH0_DISCOVERY,
    );

    const { accessToken, refreshToken } = tokenResult;
    const claims = decodeTokenClaims(accessToken);

    // If no db_id claim: user just signed up, provision the MongoDB profile
    if (!claims.dbId) {
      const provisionData = registerData
        ? {
            firstName: registerData.firstName,
            lastName: registerData.lastName,
            birthDate: registerData.birthDate ?? undefined,
            gender: registerData.gender,
          }
        : { firstName: claims.email?.split('@')[0] ?? 'Paciente', lastName: '' };

      await provisionPatient(accessToken, provisionData);

      // Fetch a fresh token so the next API calls include the db_id claim
      const refreshed = await AuthSession.refreshAsync(
        { clientId, refreshToken: refreshToken! },
        AUTH0_DISCOVERY,
      );

      const freshClaims = decodeTokenClaims(refreshed.accessToken);

      const session = {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken ?? refreshToken ?? '',
        user: {
          id: freshClaims.dbId ?? '',
          email: freshClaims.email ?? claims.email ?? '',
          role: ((freshClaims.role ?? 'PATIENT') as UserRole),
          isActive: freshClaims.isActive ?? true,
        },
      };

      await setSession(session, null);
      const profile = await authService.getCurrentPatient();
      await setSession(session, profile);
      return { session, profile };
    }

    const session = {
      accessToken,
      refreshToken: refreshToken ?? '',
      user: {
        id: claims.dbId,
        email: claims.email ?? '',
        role: ((claims.role ?? 'PATIENT') as UserRole),
        isActive: claims.isActive ?? true,
      },
    };

    await setSession(session, null);
    const profile = await authService.getCurrentPatient();
    await setSession(session, profile);
    return { session, profile };
  }

  const loginMutation = useMutation({
    mutationFn: () => authenticateWithAuth0(),
    onError: async () => {
      await clearSession();
    },
  });

  const registerMutation = useMutation({
    mutationFn: (input: RegisterInput) => authenticateWithAuth0(input),
    onError: async () => {
      await clearSession();
    },
  });

  return {
    loginMutation,
    registerMutation,
    isReady: !!request,
  };
}
