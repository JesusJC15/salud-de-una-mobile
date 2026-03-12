import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useEffect, useState } from 'react';

import {
  setApiAccessTokenResolver,
  setApiUnauthorizedRecoveryHandler,
  setApiUnauthorizedSessionHandler,
} from '@/src/services/api/client';
import { authService } from '@/src/services/auth/auth-service';
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

      const nextSession = await authService.refreshSession(refreshToken);
      await state.setSession(nextSession, state.profile);

      return nextSession.accessToken;
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
    void hydrate();
  }, [hydrate]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}