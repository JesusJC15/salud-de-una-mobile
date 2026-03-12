import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { patientNotificationService } from '@/src/services/notifications/patient-notification-service';

const PATIENT_NOTIFICATIONS_QUERY_KEY = ['patient-notifications'];

export function usePatientNotifications() {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryFn: () => patientNotificationService.list(),
    queryKey: PATIENT_NOTIFICATIONS_QUERY_KEY,
    staleTime: 30_000,
  });

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
