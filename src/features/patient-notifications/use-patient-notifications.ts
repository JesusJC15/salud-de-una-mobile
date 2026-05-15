import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import {
  subscribePatientNotificationsRealtime,
  type NotificationsRealtimeStatus,
} from '@/src/services/realtime/patient-notifications-realtime';
import { patientNotificationService } from '@/src/services/notifications/patient-notification-service';
import { showLocalFollowupNotification } from '@/src/services/notifications/push-notification-service';
import { useSessionStore } from '@/src/store/session-store';

const PATIENT_NOTIFICATIONS_QUERY_KEY = ['patient-notifications'];

export function usePatientNotifications() {
  const queryClient = useQueryClient();
  const session = useSessionStore((s) => s.session);
  const [connectionStatus, setConnectionStatus] =
    useState<NotificationsRealtimeStatus>('disconnected');

  const notificationsQuery = useQuery({
    queryFn: () => patientNotificationService.list(),
    queryKey: PATIENT_NOTIFICATIONS_QUERY_KEY,
    staleTime: 30_000,
    enabled: Boolean(session?.accessToken),
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

  useEffect(() => {
    if (!session?.accessToken) {
      setConnectionStatus('disconnected');
      return;
    }

    return subscribePatientNotificationsRealtime(session.accessToken, (event) => {
      if (event.type === 'notification:new') {
        void queryClient.invalidateQueries({ queryKey: PATIENT_NOTIFICATIONS_QUERY_KEY });
        return;
      }

      setConnectionStatus(event.status);
    });
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
    connectionStatus,
    markAllAsReadMutation,
    markAsReadMutation,
    notificationsQuery,
  };
}
