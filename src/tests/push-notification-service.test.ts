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

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));

jest.mock('@/src/services/api/client', () => ({
  apiClient: {
    patch: jest.fn(),
  },
}));

import { Platform } from 'react-native';
import { registerPushNotifications } from '@/src/services/notifications/push-notification-service';
import * as clientModule from '@/src/services/api/client';

const mockApiClient = clientModule.apiClient as any;
const mockNotifications = jest.requireMock('expo-notifications');
const mockConstants = jest.requireMock('expo-constants');

describe('registerPushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as any).OS = 'ios';
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
