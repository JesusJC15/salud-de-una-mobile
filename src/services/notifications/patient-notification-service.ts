import { apiClient } from '@/src/services/api/client';
import {
  ListNotificationsInput,
  MarkAllNotificationsAsReadResponse,
  MarkNotificationAsReadResponse,
  NotificationsResponse,
} from '@/src/types/notification';

export const patientNotificationService = {
  async list(input: ListNotificationsInput = {}) {
    const response = await apiClient.get<NotificationsResponse>('/patients/notifications', {
      params: input,
    });

    return response.data;
  },

  async markAsRead(notificationId: string) {
    const response = await apiClient.patch<MarkNotificationAsReadResponse>(
      `/patients/notifications/${notificationId}/read`
    );

    return response.data;
  },

  async markAllAsRead() {
    const response = await apiClient.patch<MarkAllNotificationsAsReadResponse>(
      '/patients/notifications/read-all'
    );

    return response.data;
  },
};
