import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useEffect, useState } from 'react';

import {
  setApiAccessTokenResolver,
  setApiUnauthorizedRecoveryHandler,
  setApiUnauthorizedSessionHandler,
} from '@/src/services/api/client';
import { ApiError } from '@/src/services/api/api-error';
import { authService } from '@/src/services/auth/auth-service';
import { refreshAuth0Session } from '@/src/services/auth/auth0-service';
import { useSessionStore } from '@/src/store/session-store';

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
        refetchOnReconnect: true,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function AppProviders({ children }: PropsWithChildren) {
  const hydrate = useSessionStore((state) => state.hydrate);
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    setApiAccessTokenResolver(() => useSessionStore.getState().session?.accessToken ?? null);
    setApiUnauthorizedRecoveryHandler(async () => {
      const state = useSessionStore.getState();
      const refreshToken = state.session?.refreshToken;

      if (!refreshToken) {
        return null;
      }

      try {
        const refreshed = await refreshAuth0Session(refreshToken);
        const nextSession = {
          ...state.session!,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken ?? refreshToken,
        };
        await state.setSession(nextSession, state.profile);
        return refreshed.accessToken;
      } catch {
        return null;
      }
    });
    setApiUnauthorizedSessionHandler(async () => {
      queryClient.clear();
      await useSessionStore.getState().clearSession();
    });

    return () => {
      setApiAccessTokenResolver(null);
      setApiUnauthorizedRecoveryHandler(null);
      setApiUnauthorizedSessionHandler(null);
    };
  }, [queryClient]);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      await hydrate();

      const initialState = useSessionStore.getState();

      if (!initialState.session || !isMounted) {
        return;
      }

      try {
        const authMe = await authService.getCurrentAuthUser();
        const nextState = useSessionStore.getState();

        if (!nextState.session || !isMounted) {
          return;
        }

        const nextSession = {
          ...nextState.session,
          user: {
            ...nextState.session.user,
            ...authMe.user,
          },
        };

        await nextState.setSession(nextSession, nextState.profile);
      } catch (error) {
        const apiError = ApiError.fromUnknown(error);

        if (apiError.statusCode === 401 || apiError.statusCode === 403) {
          queryClient.clear();
          await useSessionStore.getState().clearSession();
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [hydrate, queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}