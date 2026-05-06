import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from '@/src/services/api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerPushNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    const existingStatus = (existing as { status?: string }).status;

    if (existingStatus !== 'granted') {
      finalStatus = await Notifications.requestPermissionsAsync();
    }

    const grantedStatus = (finalStatus as { status?: string }).status;
    if (grantedStatus !== 'granted') return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    await apiClient.patch('/patients/me/push-token', { token: tokenData.data });
  } catch {
    // Non-critical — silently ignore failures
  }
}

const shownLocalNotifications = new Set<string>();

export async function showLocalFollowupNotification(input: {
  id: string;
  title: string;
  body: string;
  deepLink?: string | null;
}): Promise<void> {
  if (Platform.OS === 'web') return;
  if (shownLocalNotifications.has(input.id)) return;

  shownLocalNotifications.add(input.id);

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: input.title,
        body: input.body,
        data: {
          deepLink: input.deepLink ?? undefined,
        },
      },
      trigger: null,
    });
  } catch {
    shownLocalNotifications.delete(input.id);
  }
}
