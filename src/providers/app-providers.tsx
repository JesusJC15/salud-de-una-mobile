import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { PropsWithChildren, useEffect, useState } from 'react';

import {
  setApiAccessTokenResolver,
  setApiUnauthorizedRecoveryHandler,
  setApiUnauthorizedSessionHandler,
} from '@/src/services/api/client';
import { ApiError } from '@/src/services/api/api-error';
import { authService } from '@/src/services/auth/auth-service';
import { refreshAuth0Session } from '@/src/services/auth/auth0-service';
import { registerPushNotifications } from '@/src/services/notifications/push-notification-service';
import { useSessionStore } from '@/src/store/session-store';
import { useTriageStore } from '@/src/store/triage-store';

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
  const hydrateTriageStore = useTriageStore((state) => state.hydrate);
  const [queryClient] = useState(createQueryClient);
  const router = useRouter();

  useEffect(() => {
    setApiAccessTokenResolver(() => useSessionStore.getState().session?.accessToken ?? null);
    setApiUnauthorizedRecoveryHandler(async () => {
      const state = useSessionStore.getState();
      const { session } = state;

      if (!session?.refreshToken) {
        return null;
      }

      try {
        if (session.authMethod === 'legacy') {
          const refreshed = await authService.refreshSession(session.refreshToken);
          const nextSession = { ...refreshed, authMethod: 'legacy' as const };
          await state.setSession(nextSession, state.profile);
          return refreshed.accessToken;
        }

        const refreshed = await refreshAuth0Session(session.refreshToken);
        const nextSession = {
          ...session,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken ?? session.refreshToken,
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
      await Promise.all([hydrate(), hydrateTriageStore()]);

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
        void registerPushNotifications();
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
  }, [hydrate, hydrateTriageStore, queryClient]);

  useEffect(() => {
    function navigateFromNotification(
      response: Notifications.NotificationResponse | null,
    ) {
      const deepLink = response?.notification.request.content.data?.deepLink;
      if (typeof deepLink === 'string' && deepLink.length > 0) {
        router.push(deepLink as never);
      }
    }

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      navigateFromNotification(response);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      navigateFromNotification,
    );

    return () => {
      subscription.remove();
    };
  }, [router]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
