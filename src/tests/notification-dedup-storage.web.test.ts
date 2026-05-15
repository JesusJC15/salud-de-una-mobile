type DedupStorageModule = typeof import('@/src/services/storage/notification-dedup-storage');

type LocalStorageMock = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

async function loadWebStorageModule(
  localStorageMock?: LocalStorageMock,
): Promise<{
  module: DedupStorageModule;
  secureStoreGet: jest.Mock;
  secureStoreSet: jest.Mock;
}> {
  jest.resetModules();
  const globalScope = globalThis as unknown as { localStorage?: LocalStorageMock };

  if (localStorageMock) {
    globalScope.localStorage = localStorageMock;
  } else {
    delete globalScope.localStorage;
  }

  const secureStoreGet = jest.fn();
  const secureStoreSet = jest.fn();

  jest.doMock('react-native', () => ({ Platform: { OS: 'web' } }));
  jest.doMock('expo-secure-store', () => ({
    getItemAsync: secureStoreGet,
    setItemAsync: secureStoreSet,
  }));

  const module = await import('@/src/services/storage/notification-dedup-storage');
  return { module, secureStoreGet, secureStoreSet };
}

describe('notification-dedup-storage (web)', () => {
  afterEach(() => {
    const globalScope = globalThis as unknown as { localStorage?: LocalStorageMock };
    delete globalScope.localStorage;
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('reads and writes using localStorage on web', async () => {
    const localStorageMock: LocalStorageMock = {
      getItem: jest.fn().mockReturnValue(JSON.stringify([{ id: 'notif-1', shownAt: Date.now() }])),
      setItem: jest.fn(),
    };
    const { module, secureStoreGet, secureStoreSet } = await loadWebStorageModule(localStorageMock);

    await expect(module.hasShownNotification('notif-1')).resolves.toBe(true);
    await module.markNotificationShown('notif-2');

    expect(localStorageMock.getItem).toHaveBeenCalledTimes(2);
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    expect(secureStoreGet).not.toHaveBeenCalled();
    expect(secureStoreSet).not.toHaveBeenCalled();
  });

  it('handles missing localStorage gracefully', async () => {
    const { module, secureStoreGet, secureStoreSet } = await loadWebStorageModule(undefined);

    await expect(module.hasShownNotification('notif-1')).resolves.toBe(false);
    await expect(module.markNotificationShown('notif-1')).resolves.toBeUndefined();

    expect(secureStoreGet).not.toHaveBeenCalled();
    expect(secureStoreSet).not.toHaveBeenCalled();
  });

  it('recovers from localStorage read errors', async () => {
    const localStorageMock: LocalStorageMock = {
      getItem: jest.fn((_: string) => {
        throw new Error('blocked');
      }),
      setItem: jest.fn(),
    };
    const { module } = await loadWebStorageModule(localStorageMock);

    await expect(module.hasShownNotification('notif-1')).resolves.toBe(false);
  });
});
