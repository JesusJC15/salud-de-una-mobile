import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from '@/src/services/api/client';
import {
  hasShownNotification,
  markNotificationShown,
} from '@/src/services/storage/notification-dedup-storage';

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

export async function showLocalFollowupNotification(input: {
  id: string;
  title: string;
  body: string;
  deepLink?: string | null;
}): Promise<void> {
  if (Platform.OS === 'web') return;

  const alreadyShown = await hasShownNotification(input.id);
  if (alreadyShown) return;

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
    await markNotificationShown(input.id);
  } catch {
    // Scheduling failed — don't mark as shown so we retry next time
  }
}
