import { patientNotificationService } from '@/src/services/notifications/patient-notification-service';
import { apiClient } from '@/src/services/api/client';

jest.mock('@/src/services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('patientNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('list calls GET /notifications/me with query params', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { items: [], unreadCount: 0 } });

    await patientNotificationService.list({ limit: 10, unreadOnly: true });

    expect(apiClient.get).toHaveBeenCalledWith('/notifications/me', {
      params: { limit: 10, unreadOnly: true },
    });
  });

  it('list uses an empty params object when no filters are provided', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { items: [], unreadCount: 0 } });

    await patientNotificationService.list();

    expect(apiClient.get).toHaveBeenCalledWith('/notifications/me', {
      params: {},
    });
  });

  it('markAsRead calls PATCH /notifications/:notificationId/read', async () => {
    (apiClient.patch as jest.Mock).mockResolvedValue({ data: { id: 'n1', read: true } });

    await patientNotificationService.markAsRead('n1');

    expect(apiClient.patch).toHaveBeenCalledWith('/notifications/n1/read');
  });

  it('markAllAsRead calls PATCH /notifications/me/read-all', async () => {
    (apiClient.patch as jest.Mock).mockResolvedValue({ data: { updatedCount: 1 } });

    await patientNotificationService.markAllAsRead();

    expect(apiClient.patch).toHaveBeenCalledWith('/notifications/me/read-all');
  });
});
