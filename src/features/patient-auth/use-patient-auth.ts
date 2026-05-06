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
import type { LoginInput, RegisterInput } from '@/src/schemas/auth';

// Subset used for Auth0 registration — email/password are handled by Auth0.
type Auth0RegisterData = Pick<RegisterInput, 'firstName' | 'lastName' | 'birthDate' | 'gender'>;

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

  async function authenticateWithAuth0(registerData?: Auth0RegisterData) {
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

      if (!refreshToken) {
        throw new Error(
          'Auth0 no devolvió refresh token. Verifica que el scope "offline_access" esté habilitado en la Application.',
        );
      }

      // Fetch a fresh token so the next API calls include the db_id claim.
      // The Auth0 Action runs on every issuance — the refreshed token will
      // contain the app_metadata.db_id we just set via provisioning.
      const refreshed = await AuthSession.refreshAsync(
        { clientId, refreshToken },
        AUTH0_DISCOVERY,
      );

      const freshClaims = decodeTokenClaims(refreshed.accessToken);

      if (!freshClaims.dbId) {
        throw new Error(
          'El token actualizado no incluye db_id. Verifica que el Auth0 Action "Inject SaludDeUna Custom Claims" esté activo y publicado.',
        );
      }

      const session = {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken ?? refreshToken,
        user: {
          id: freshClaims.dbId,
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

  async function loginWithEmail(input: LoginInput) {
    const session = await authService.loginPatient(input);
    const fullSession = { ...session, authMethod: 'legacy' as const };
    await setSession(fullSession, null);
    const profile = await authService.getCurrentPatient();
    await setSession(fullSession, profile);
    return { session: fullSession, profile };
  }

  async function registerWithEmail(input: RegisterInput) {
    await authService.registerPatient(input);
    const session = await authService.loginPatient({ email: input.email, password: input.password });
    const fullSession = { ...session, authMethod: 'legacy' as const };
    await setSession(fullSession, null);
    const profile = await authService.getCurrentPatient();
    await setSession(fullSession, profile);
    return { session: fullSession, profile };
  }

  const loginMutation = useMutation({
    mutationFn: () => authenticateWithAuth0(),
    onError: async () => { await clearSession(); },
  });

  const registerMutation = useMutation({
    mutationFn: (input: Auth0RegisterData) => authenticateWithAuth0(input),
    onError: async () => { await clearSession(); },
  });

  const loginWithEmailMutation = useMutation({
    mutationFn: (input: LoginInput) => loginWithEmail(input),
    onError: async () => { await clearSession(); },
  });

  const registerWithEmailMutation = useMutation({
    mutationFn: (input: RegisterInput) => registerWithEmail(input),
    onError: async () => { await clearSession(); },
  });

  return {
    loginMutation,
    registerMutation,
    loginWithEmailMutation,
    registerWithEmailMutation,
    isReady: !!request,
  };
}
