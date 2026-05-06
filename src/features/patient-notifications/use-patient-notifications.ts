import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { patientNotificationService } from '@/src/services/notifications/patient-notification-service';
import { showLocalFollowupNotification } from '@/src/services/notifications/push-notification-service';

const PATIENT_NOTIFICATIONS_QUERY_KEY = ['patient-notifications'];

export function usePatientNotifications() {
  const queryClient = useQueryClient();

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
