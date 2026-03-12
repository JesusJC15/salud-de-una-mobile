import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useEffect, useState } from 'react';

import { setApiAccessTokenResolver } from '@/src/services/api/client';
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

    return () => {
      setApiAccessTokenResolver(null);
    };
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}