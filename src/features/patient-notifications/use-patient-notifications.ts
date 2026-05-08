import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';

import { appConfig } from '@/src/config/env';
import { patientNotificationService } from '@/src/services/notifications/patient-notification-service';
import { showLocalFollowupNotification } from '@/src/services/notifications/push-notification-service';
import { useSessionStore } from '@/src/store/session-store';

function trimTrailingSlashes(url: string): string {
  let end = url.length;
  while (end > 0 && url[end - 1] === '/') end--;
  return end === url.length ? url : url.slice(0, end);
}

const WS_BASE_URL = trimTrailingSlashes(
  (appConfig.apiBaseUrl ?? 'http://localhost:3000').replace(/\/v1$/, ''),
);

const PATIENT_NOTIFICATIONS_QUERY_KEY = ['patient-notifications'];

export function usePatientNotifications() {
  const queryClient = useQueryClient();
  const session = useSessionStore((s) => s.session);
  const socketRef = useRef<Socket | null>(null);

  const notificationsQuery = useQuery({
    queryFn: () => patientNotificationService.list(),
    queryKey: PATIENT_NOTIFICATIONS_QUERY_KEY,
    staleTime: 30_000,
  });

  useEffect(() => {
    const items = notificationsQuery.data?.items ?? [];
    for (const item of items) {
      if (item.type === 'FOLLOWUP_REMINDER' && !item.read) {
        void showLocalFollowupNotification({
          id: item.id,
          title: 'Seguimiento pendiente',
          body: item.message,
          deepLink: item.deepLink,
        });
      }
    }
  }, [notificationsQuery.data]);

  // Real-time notifications via WebSocket
  useEffect(() => {
    if (!session?.accessToken) return;

    const socket = io(`${WS_BASE_URL}/notifications`, {
      auth: { token: session.accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1500,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('notification:new', () => {
      void queryClient.invalidateQueries({ queryKey: PATIENT_NOTIFICATIONS_QUERY_KEY });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session?.accessToken, queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => patientNotificationService.markAsRead(notificationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PATIENT_NOTIFICATIONS_QUERY_KEY });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => patientNotificationService.markAllAsRead(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PATIENT_NOTIFICATIONS_QUERY_KEY });
    },
  });

  return {
    markAllAsReadMutation,
    markAsReadMutation,
    notificationsQuery,
  };
}
