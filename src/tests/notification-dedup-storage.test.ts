import * as SecureStore from 'expo-secure-store';
import {
  hasShownNotification,
  markNotificationShown,
} from '@/src/services/storage/notification-dedup-storage';

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('notification-dedup-storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasShownNotification', () => {
    it('returns false when storage is empty', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      expect(await hasShownNotification('notif-1')).toBe(false);
    });

    it('returns false for an unknown ID', async () => {
      const entries = JSON.stringify([{ id: 'notif-other', shownAt: Date.now() }]);
      mockSecureStore.getItemAsync.mockResolvedValue(entries);
      expect(await hasShownNotification('notif-1')).toBe(false);
    });

    it('returns true for a known ID', async () => {
      const entries = JSON.stringify([{ id: 'notif-1', shownAt: Date.now() }]);
      mockSecureStore.getItemAsync.mockResolvedValue(entries);
      expect(await hasShownNotification('notif-1')).toBe(true);
    });

    it('returns false when storage read fails', async () => {
      mockSecureStore.getItemAsync.mockRejectedValue(new Error('read failed'));
      expect(await hasShownNotification('notif-1')).toBe(false);
    });
  });

  describe('markNotificationShown', () => {
    it('writes the notification id to storage', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      mockSecureStore.setItemAsync.mockResolvedValue(undefined);

      await markNotificationShown('notif-1');

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledTimes(1);
      const [, writtenValue] = mockSecureStore.setItemAsync.mock.calls[0];
      const written = JSON.parse(writtenValue as string) as { id: string }[];
      expect(written.some((e) => e.id === 'notif-1')).toBe(true);
    });

    it('does not duplicate an already-stored id', async () => {
      const existing = JSON.stringify([{ id: 'notif-1', shownAt: Date.now() }]);
      mockSecureStore.getItemAsync.mockResolvedValue(existing);

      await markNotificationShown('notif-1');

      expect(mockSecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('prunes entries older than 7 days', async () => {
      const oldTs = Date.now() - 8 * 24 * 60 * 60 * 1000;
      const old = JSON.stringify([{ id: 'notif-old', shownAt: oldTs }]);
      mockSecureStore.getItemAsync.mockResolvedValue(old);
      mockSecureStore.setItemAsync.mockResolvedValue(undefined);

      await markNotificationShown('notif-new');

      const [, writtenValue] = mockSecureStore.setItemAsync.mock.calls[0];
      const written = JSON.parse(writtenValue as string) as { id: string }[];
      expect(written.some((e) => e.id === 'notif-old')).toBe(false);
      expect(written.some((e) => e.id === 'notif-new')).toBe(true);
    });

    it('does not throw when storage write fails', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      mockSecureStore.setItemAsync.mockRejectedValue(new Error('write failed'));

      await expect(markNotificationShown('notif-2')).resolves.toBeUndefined();
    });
  });
});
