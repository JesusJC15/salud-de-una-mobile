import { apiClient } from '@/src/services/api/client';
import {
  ListNotificationsInput,
  MarkAllNotificationsAsReadResponse,
  MarkNotificationAsReadResponse,
  NotificationsResponse,
} from '@/src/types/notification';

export const patientNotificationService = {
  async list(input: ListNotificationsInput = {}) {
    const response = await apiClient.get<NotificationsResponse>('/notifications/me', {
      params: input,
    });

    return response.data;
  },

  async markAsRead(notificationId: string) {
    const response = await apiClient.patch<MarkNotificationAsReadResponse>(
      `/notifications/${notificationId}/read`
    );

    return response.data;
  },

  async markAllAsRead() {
    const response = await apiClient.patch<MarkAllNotificationsAsReadResponse>(
      '/notifications/me/read-all'
    );

    return response.data;
  },
};
