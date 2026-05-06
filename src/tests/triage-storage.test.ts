import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  persistConsultationId,
  readStoredConsultationId,
} from '@/src/services/storage/triage-storage';

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
}));

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('triage-storage', () => {
  const TRIAGE_KEY = 'salud-de-una.patient.triage';

  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as any).OS = 'ios';
    // Setup localStorage mock for web tests
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    global.localStorage = localStorageMock as any;
  });

  describe('persistConsultationId', () => {
    describe('on native platform (iOS/Android)', () => {
      beforeEach(() => {
        (Platform as any).OS = 'ios';
      });

      it('saves consultation ID to SecureStore', async () => {
        await persistConsultationId('consultation-123');

        expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
          TRIAGE_KEY,
          'consultation-123',
        );
      });

      it('deletes consultation ID from SecureStore when null', async () => {
        await persistConsultationId(null);

        expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(TRIAGE_KEY);
      });

      it('handles empty string as valid ID', async () => {
        await persistConsultationId('');

        expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(TRIAGE_KEY, '');
      });

      it('handles long consultation IDs', async () => {
        const longId = 'a'.repeat(500);
        await persistConsultationId(longId);

        expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(TRIAGE_KEY, longId);
      });

      it('overwrites existing ID', async () => {
        await persistConsultationId('id-1');
        await persistConsultationId('id-2');

        expect(mockSecureStore.setItemAsync).toHaveBeenLastCalledWith(TRIAGE_KEY, 'id-2');
      });

      it('handles SecureStore errors gracefully', async () => {
        mockSecureStore.setItemAsync.mockRejectedValueOnce(
          new Error('SecureStore error'),
        );

        await expect(persistConsultationId('id')).rejects.toThrow('SecureStore error');
      });

      it('works on Android platform', async () => {
        (Platform as any).OS = 'android';

        await persistConsultationId('android-id-123');

        expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
          TRIAGE_KEY,
          'android-id-123',
        );
      });
    });

    describe('on web platform', () => {
      beforeEach(() => {
        (Platform as any).OS = 'web';
      });

      it('saves to localStorage', async () => {
        await persistConsultationId('web-id-123');

        expect(global.localStorage.setItem).toHaveBeenCalledWith(TRIAGE_KEY, 'web-id-123');
      });

      it('removes from localStorage when null', async () => {
        await persistConsultationId(null);

        expect(global.localStorage.removeItem).toHaveBeenCalledWith(TRIAGE_KEY);
      });

      it('does not call SecureStore on web', async () => {
        await persistConsultationId('web-id-123');

        expect(mockSecureStore.setItemAsync).not.toHaveBeenCalled();
      });

      it('overwrites existing localStorage value', async () => {
        await persistConsultationId('new-id');

        expect(global.localStorage.setItem).toHaveBeenCalledWith(TRIAGE_KEY, 'new-id');
      });

      it('handles special characters in ID', async () => {
        const specialId = 'id-with-@#$%^&*()_+-=[]{}';
        await persistConsultationId(specialId);

        expect(global.localStorage.setItem).toHaveBeenCalledWith(TRIAGE_KEY, specialId);
      });

      it('handles localStorage being undefined gracefully', async () => {
        delete (global as any).localStorage;

        await persistConsultationId('id-123');

        const localStorageMock = {
          getItem: jest.fn(),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
        };
        global.localStorage = localStorageMock as any;
      });
    });
  });

  describe('readStoredConsultationId', () => {
    describe('on native platform (iOS/Android)', () => {
      beforeEach(() => {
        (Platform as any).OS = 'ios';
      });

      it('retrieves consultation ID from SecureStore', async () => {
        mockSecureStore.getItemAsync.mockResolvedValue('stored-id-123');

        const result = await readStoredConsultationId();

        expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(TRIAGE_KEY);
        expect(result).toBe('stored-id-123');
      });

      it('returns null when no ID is stored', async () => {
        mockSecureStore.getItemAsync.mockResolvedValue(null);

        const result = await readStoredConsultationId();

        expect(result).toBeNull();
      });

      it('returns empty string if that was stored', async () => {
        mockSecureStore.getItemAsync.mockResolvedValue('');

        const result = await readStoredConsultationId();

        expect(result).toBe('');
      });

      it('handles SecureStore errors gracefully', async () => {
        mockSecureStore.getItemAsync.mockRejectedValueOnce(
          new Error('SecureStore read error'),
        );

        await expect(readStoredConsultationId()).rejects.toThrow('SecureStore read error');
      });

      it('returns long stored IDs', async () => {
        const longId = 'b'.repeat(500);
        mockSecureStore.getItemAsync.mockResolvedValue(longId);

        const result = await readStoredConsultationId();

        expect(result).toBe(longId);
      });

      it('works on Android platform', async () => {
        (Platform as any).OS = 'android';
        mockSecureStore.getItemAsync.mockResolvedValue('android-stored-id');

        const result = await readStoredConsultationId();

        expect(result).toBe('android-stored-id');
      });
    });

    describe('on web platform', () => {
      beforeEach(() => {
        (Platform as any).OS = 'web';
      });

      it('retrieves from localStorage', async () => {
        (global.localStorage.getItem as jest.Mock).mockReturnValue('web-stored-id');

        const result = await readStoredConsultationId();

        expect(global.localStorage.getItem).toHaveBeenCalledWith(TRIAGE_KEY);
        expect(result).toBe('web-stored-id');
      });

      it('returns null when not in localStorage', async () => {
        (global.localStorage.getItem as jest.Mock).mockReturnValue(null);

        const result = await readStoredConsultationId();

        expect(result).toBeNull();
      });

      it('does not call SecureStore on web', async () => {
        (global.localStorage.getItem as jest.Mock).mockReturnValue('web-id');

        await readStoredConsultationId();

        expect(mockSecureStore.getItemAsync).not.toHaveBeenCalled();
      });

      it('returns empty string if stored', async () => {
        (global.localStorage.getItem as jest.Mock).mockReturnValue('');

        const result = await readStoredConsultationId();

        expect(result).toBe('');
      });

      it('handles localStorage being undefined', async () => {
        delete (global as any).localStorage;

        const result = await readStoredConsultationId();

        expect(result).toBeNull();

        const localStorageMock = {
          getItem: jest.fn(),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
        };
        global.localStorage = localStorageMock as any;
      });

      it('returns special characters from localStorage', async () => {
        const specialId = 'id-with-@#$%^&*()_+-=[]{}';
        (global.localStorage.getItem as jest.Mock).mockReturnValue(specialId);

        const result = await readStoredConsultationId();

        expect(result).toBe(specialId);
      });
    });
  });

  describe('integration: read and write together', () => {
    beforeEach(() => {
      (Platform as any).OS = 'ios';
      mockSecureStore.getItemAsync.mockResolvedValue(null);
    });

    it('write and then read on native', async () => {
      await persistConsultationId('integration-id');

      mockSecureStore.getItemAsync.mockResolvedValue('integration-id');
      const result = await readStoredConsultationId();

      expect(result).toBe('integration-id');
    });

    it('write null and then read returns null on native', async () => {
      await persistConsultationId(null);

      mockSecureStore.getItemAsync.mockResolvedValue(null);
      const result = await readStoredConsultationId();

      expect(result).toBeNull();
    });

    it('write and read on web platform', async () => {
      (Platform as any).OS = 'web';
      (global.localStorage.setItem as jest.Mock).mockClear();
      (global.localStorage.getItem as jest.Mock).mockClear();

      await persistConsultationId('web-integration-id');

      (global.localStorage.getItem as jest.Mock).mockReturnValue('web-integration-id');
      const result = await readStoredConsultationId();

      expect(result).toBe('web-integration-id');
    });

    it('multiple write/read cycles on web', async () => {
      (Platform as any).OS = 'web';
      (global.localStorage.setItem as jest.Mock).mockClear();
      (global.localStorage.getItem as jest.Mock).mockClear();

      await persistConsultationId('id-1');
      (global.localStorage.getItem as jest.Mock).mockReturnValue('id-1');
      expect(await readStoredConsultationId()).toBe('id-1');

      (global.localStorage.getItem as jest.Mock).mockClear();
      await persistConsultationId('id-2');
      (global.localStorage.getItem as jest.Mock).mockReturnValue('id-2');
      expect(await readStoredConsultationId()).toBe('id-2');

      (global.localStorage.getItem as jest.Mock).mockClear();
      await persistConsultationId(null);
      (global.localStorage.getItem as jest.Mock).mockReturnValue(null);
      expect(await readStoredConsultationId()).toBeNull();
    });
  });
});
