import { Platform } from 'react-native';
import { registerPushNotifications, showLocalFollowupNotification } from '@/src/services/notifications/push-notification-service';
import * as clientModule from '@/src/services/api/client';

// Mock modules before importing the service
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      eas: {
        projectId: 'test-project-id',
      },
    },
  },
  easConfig: {
    projectId: 'test-project-id',
  },
}));

// Simulate real SecureStore: setItemAsync stores, getItemAsync reads back
const secureStoreData: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(secureStoreData[key] ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    secureStoreData[key] = value;
    return Promise.resolve(undefined);
  }),
  deleteItemAsync: jest.fn((key: string) => {
    delete secureStoreData[key];
    return Promise.resolve(undefined);
  }),
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

jest.mock('@/src/services/api/client', () => ({
  apiClient: {
    patch: jest.fn(),
  },
}));

const mockApiClient = clientModule.apiClient as any;
const mockNotifications = jest.requireMock('expo-notifications');
const mockConstants = jest.requireMock('expo-constants');

describe('registerPushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as any).OS = 'ios';
  });

  it('configures the notification handler on module load', async () => {
    jest.resetModules();
    const isolatedNotifications = jest.requireMock('expo-notifications');

    await jest.isolateModulesAsync(async () => {
      await import('@/src/services/notifications/push-notification-service');
    });

    expect(isolatedNotifications.setNotificationHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        handleNotification: expect.any(Function),
      }),
    );

    const handler = isolatedNotifications.setNotificationHandler.mock.calls[0][0];
    await expect(handler.handleNotification()).resolves.toEqual({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    });
  });

  it('returns early on web platform', async () => {
    (Platform as any).OS = 'web';

    await registerPushNotifications();

    expect(mockNotifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(mockApiClient.patch).not.toHaveBeenCalled();
  });

  it('checks for existing permissions', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'token-123' } as any);
    mockApiClient.patch.mockResolvedValue({ data: { ok: true } } as any);

    await registerPushNotifications();

    expect(mockNotifications.getPermissionsAsync).toHaveBeenCalled();
  });

  it('requests permissions if not granted', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' } as any);
    mockNotifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'token-123' } as any);
    mockApiClient.patch.mockResolvedValue({ data: { ok: true } } as any);

    await registerPushNotifications();

    expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled();
  });

  it('returns early if permissions denied', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' } as any);
    mockNotifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' } as any);

    await registerPushNotifications();

    expect(mockNotifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(mockApiClient.patch).not.toHaveBeenCalled();
  });

  it('retrieves push token with projectId from expoConfig', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'token-123' } as any);
    mockApiClient.patch.mockResolvedValue({ data: { ok: true } } as any);

    await registerPushNotifications();

    expect(mockNotifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'test-project-id' });
  });

  it('retrieves push token without projectId if not configured', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'token-456' } as any);
    mockApiClient.patch.mockResolvedValue({ data: { ok: true } } as any);

    mockConstants.expoConfig = { extra: {} } as any;
    mockConstants.easConfig = {} as any;

    await registerPushNotifications();

    expect(mockNotifications.getExpoPushTokenAsync).toHaveBeenCalledWith(undefined);
  });

  it('sends token to backend API', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'token-123' } as any);
    mockApiClient.patch.mockResolvedValue({ data: { ok: true } } as any);

    await registerPushNotifications();

    expect(mockApiClient.patch).toHaveBeenCalledWith('/patients/me/push-token', {
      token: 'token-123',
    });
  });

  it('silently ignores permission check errors', async () => {
    mockNotifications.getPermissionsAsync.mockRejectedValue(new Error('Permission check failed'));

    await expect(registerPushNotifications()).resolves.toBeUndefined();
  });

  it('silently ignores token request errors', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockNotifications.getExpoPushTokenAsync.mockRejectedValue(new Error('Token request failed'));

    await expect(registerPushNotifications()).resolves.toBeUndefined();
  });

  it('silently ignores API errors', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'token-123' } as any);
    mockApiClient.patch.mockRejectedValue(new Error('API error'));

    await expect(registerPushNotifications()).resolves.toBeUndefined();
  });

  it('handles multiple sequential calls', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'token-123' } as any);
    mockApiClient.patch.mockResolvedValue({ data: { ok: true } } as any);

    await registerPushNotifications();
    await registerPushNotifications();

    expect(mockNotifications.getPermissionsAsync).toHaveBeenCalledTimes(2);
    expect(mockNotifications.getExpoPushTokenAsync).toHaveBeenCalledTimes(2);
    expect(mockApiClient.patch).toHaveBeenCalledTimes(2);
  });

  it('works on Android platform', async () => {
    (Platform as any).OS = 'android';

    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'android-token' } as any);
    mockApiClient.patch.mockResolvedValue({ data: { ok: true } } as any);

    await registerPushNotifications();

    expect(mockApiClient.patch).toHaveBeenCalledWith('/patients/me/push-token', {
      token: 'android-token',
    });
  });

  it('uses easConfig projectId as fallback', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'token-789' } as any);
    mockApiClient.patch.mockResolvedValue({ data: { ok: true } } as any);

    mockConstants.expoConfig = undefined as any;
    mockConstants.easConfig = { projectId: 'eas-project-id' } as any;

    await registerPushNotifications();

    expect(mockNotifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'eas-project-id' });
  });

  it('handles permission status already granted', async () => {
    mockNotifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'token-123' } as any);
    mockApiClient.patch.mockResolvedValue({ data: { ok: true } } as any);

    await registerPushNotifications();

    expect(mockNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(mockNotifications.getExpoPushTokenAsync).toHaveBeenCalled();
  });

  it('handles all error types generically', async () => {
    mockNotifications.getPermissionsAsync.mockRejectedValue({ some: 'error', message: 'Failed' });

    await expect(registerPushNotifications()).resolves.toBeUndefined();
  });
});

describe('showLocalFollowupNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the simulated SecureStore between tests
    Object.keys(secureStoreData).forEach((k) => delete secureStoreData[k]);
    (Platform as any).OS = 'ios';
  });

  it('returns early on web platform', async () => {
    (Platform as any).OS = 'web';

    await showLocalFollowupNotification({ id: 'n1', title: 'T', body: 'B' });

    expect(mockNotifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules a local notification', async () => {
    mockNotifications.scheduleNotificationAsync.mockResolvedValue(undefined);

    await showLocalFollowupNotification({ id: 'n-unique-1', title: 'Recordatorio', body: 'Tu seguimiento' });

    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: { title: 'Recordatorio', body: 'Tu seguimiento', data: { deepLink: undefined } },
      trigger: null,
    });
  });

  it('passes deepLink in notification data when provided', async () => {
    mockNotifications.scheduleNotificationAsync.mockResolvedValue(undefined);

    await showLocalFollowupNotification({ id: 'n-unique-2', title: 'T', body: 'B', deepLink: '/followup/123' });

    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ data: { deepLink: '/followup/123' } }) }),
    );
  });

  it('does not schedule the same notification id twice', async () => {
    mockNotifications.scheduleNotificationAsync.mockResolvedValue(undefined);

    await showLocalFollowupNotification({ id: 'n-dedup', title: 'T', body: 'B' });
    await showLocalFollowupNotification({ id: 'n-dedup', title: 'T', body: 'B' });

    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });

  it('silently ignores schedule errors and allows retry', async () => {
    mockNotifications.scheduleNotificationAsync.mockRejectedValue(new Error('schedule failed'));

    await expect(
      showLocalFollowupNotification({ id: 'n-err-retry', title: 'T', body: 'B' }),
    ).resolves.toBeUndefined();

    mockNotifications.scheduleNotificationAsync.mockResolvedValue(undefined);
    await showLocalFollowupNotification({ id: 'n-err-retry', title: 'T', body: 'B' });
    expect(mockNotifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  });
});
