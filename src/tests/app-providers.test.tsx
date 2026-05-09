import { ApiError } from '@/src/services/api/api-error';

const queryClientClear = jest.fn();
const routerPush = jest.fn();
const setApiAccessTokenResolver = jest.fn();
const setApiUnauthorizedRecoveryHandler = jest.fn();
const setApiUnauthorizedSessionHandler = jest.fn();
const refreshSession = jest.fn();
const getCurrentAuthUser = jest.fn();
const refreshAuth0Session = jest.fn();
const registerPushNotifications = jest.fn();
const getLastNotificationResponseAsync = jest.fn();
const addNotificationResponseReceivedListener = jest.fn();
const notificationRemove = jest.fn();
const sessionStoreHook = jest.fn();
const triageStoreHook = jest.fn();
const useEffectMock = jest.fn();
const useStateMock = jest.fn();

type MockSessionState = {
  session: {
    accessToken: string;
    refreshToken?: string | null;
    authMethod: 'legacy' | 'auth0';
    user: {
      id?: string;
      email: string;
      role: string;
      isActive: boolean;
    };
  } | null;
  profile: { id: string } | null;
  hydrate: jest.Mock<Promise<void>, []>;
  setSession: jest.Mock<Promise<void>, [unknown, unknown]>;
  clearSession: jest.Mock<Promise<void>, []>;
};

type MockTriageState = {
  hydrate: jest.Mock<Promise<void>, []>;
};

let sessionState: MockSessionState;
let triageState: MockTriageState;
const effectCleanups: (undefined | (() => void))[] = [];

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useEffect: useEffectMock,
    useState: useStateMock,
  };
});

jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn(() => ({
    clear: queryClientClear,
  })),
  QueryClientProvider: jest.fn(({ children }: { children: unknown }) => children),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: routerPush,
  })),
}));

jest.mock('expo-notifications', () => ({
  getLastNotificationResponseAsync,
  addNotificationResponseReceivedListener,
}));

jest.mock('@/src/services/api/client', () => ({
  setApiAccessTokenResolver,
  setApiUnauthorizedRecoveryHandler,
  setApiUnauthorizedSessionHandler,
}));

jest.mock('@/src/services/auth/auth-service', () => ({
  authService: {
    refreshSession,
    getCurrentAuthUser,
  },
}));

jest.mock('@/src/services/auth/auth0-service', () => ({
  refreshAuth0Session,
}));

jest.mock('@/src/services/notifications/push-notification-service', () => ({
  registerPushNotifications,
}));

jest.mock('@/src/store/session-store', () => ({
  useSessionStore: Object.assign(
    (selector: (state: MockSessionState) => unknown) => sessionStoreHook(selector),
    {
      getState: () => sessionState,
    },
  ),
}));

jest.mock('@/src/store/triage-store', () => ({
  useTriageStore: (selector: (state: MockTriageState) => unknown) =>
    triageStoreHook(selector),
}));

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

async function renderAppProviders() {
  const { AppProviders } = (await import('@/src/providers/app-providers')) as {
    AppProviders: (props: { children: unknown }) => unknown;
  };
  AppProviders({ children: 'child' });
  await flushPromises();

  return {
    cleanups: [...effectCleanups],
  };
}

describe('AppProviders', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    effectCleanups.length = 0;

    sessionState = {
      session: null,
      profile: null,
      hydrate: jest.fn().mockResolvedValue(undefined),
      setSession: jest.fn().mockResolvedValue(undefined),
      clearSession: jest.fn().mockResolvedValue(undefined),
    };
    triageState = {
      hydrate: jest.fn().mockResolvedValue(undefined),
    };

    sessionStoreHook.mockImplementation((selector: (state: MockSessionState) => unknown) =>
      selector(sessionState),
    );
    triageStoreHook.mockImplementation((selector: (state: MockTriageState) => unknown) =>
      selector(triageState),
    );

    useStateMock.mockImplementation((value: unknown) => [
      typeof value === 'function' ? (value as () => unknown)() : value,
      jest.fn(),
    ]);
    useEffectMock.mockImplementation((callback: () => void | (() => void)) => {
      const cleanup = callback();
      effectCleanups.push(typeof cleanup === 'function' ? cleanup : undefined);
    });

    getLastNotificationResponseAsync.mockResolvedValue(null);
    addNotificationResponseReceivedListener.mockReturnValue({
      remove: notificationRemove,
    });
    getCurrentAuthUser.mockResolvedValue({
      user: {
        id: 'user-auth',
        email: 'user@example.com',
        role: 'PATIENT',
        isActive: true,
      },
    });
    refreshSession.mockResolvedValue({
      accessToken: 'legacy-next-token',
      refreshToken: 'legacy-next-refresh',
      user: {
        email: 'legacy@example.com',
        role: 'PATIENT',
        isActive: true,
      },
    });
    refreshAuth0Session.mockResolvedValue({
      accessToken: 'auth0-next-token',
      refreshToken: 'auth0-next-refresh',
    });
  });

  it('registers auth handlers and cleans them up on unmount', async () => {
    const { cleanups } = await renderAppProviders();

    expect(setApiAccessTokenResolver).toHaveBeenCalledWith(expect.any(Function));
    expect(setApiUnauthorizedRecoveryHandler).toHaveBeenCalledWith(
      expect.any(Function),
    );
    expect(setApiUnauthorizedSessionHandler).toHaveBeenCalledWith(
      expect.any(Function),
    );

    const accessTokenResolver = setApiAccessTokenResolver.mock.calls[0][0] as () => string | null;
    expect(accessTokenResolver()).toBeNull();

    cleanups.forEach((cleanup) => cleanup?.());

    expect(setApiAccessTokenResolver).toHaveBeenLastCalledWith(null);
    expect(setApiUnauthorizedRecoveryHandler).toHaveBeenLastCalledWith(null);
    expect(setApiUnauthorizedSessionHandler).toHaveBeenLastCalledWith(null);
    expect(notificationRemove).toHaveBeenCalled();
  });

  it('refreshes a legacy session and clears session on unauthorized handler', async () => {
    sessionState.session = {
      accessToken: 'legacy-token',
      refreshToken: 'legacy-refresh',
      authMethod: 'legacy',
      user: {
        email: 'legacy@example.com',
        role: 'PATIENT',
        isActive: true,
      },
    };
    sessionState.profile = { id: 'profile-1' };

    await renderAppProviders();

    const unauthorizedRecoveryHandler = setApiUnauthorizedRecoveryHandler.mock.calls[0][0] as (
      error: ApiError,
    ) => Promise<string | null>;
    const unauthorizedSessionHandler = setApiUnauthorizedSessionHandler.mock.calls[0][0] as () => Promise<void>;

    await expect(
      unauthorizedRecoveryHandler(new ApiError('Unauthorized', { statusCode: 401 })),
    ).resolves.toBe('legacy-next-token');
    expect(refreshSession).toHaveBeenCalledWith('legacy-refresh');
    expect(sessionState.setSession).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'legacy-next-token',
        authMethod: 'legacy',
      }),
      sessionState.profile,
    );

    await unauthorizedSessionHandler();

    expect(queryClientClear).toHaveBeenCalled();
    expect(sessionState.clearSession).toHaveBeenCalled();
  });

  it('refreshes an Auth0 session and returns null when no refresh token or recovery fails', async () => {
    sessionState.session = {
      accessToken: 'auth0-token',
      refreshToken: 'auth0-refresh',
      authMethod: 'auth0',
      user: {
        email: 'auth0@example.com',
        role: 'PATIENT',
        isActive: true,
      },
    };
    sessionState.profile = { id: 'profile-auth0' };

    await renderAppProviders();

    const unauthorizedRecoveryHandler = setApiUnauthorizedRecoveryHandler.mock.calls[0][0] as (
      error: ApiError,
    ) => Promise<string | null>;

    await expect(
      unauthorizedRecoveryHandler(new ApiError('Unauthorized', { statusCode: 401 })),
    ).resolves.toBe('auth0-next-token');
    expect(refreshAuth0Session).toHaveBeenCalledWith('auth0-refresh');

    sessionState.session = {
      ...sessionState.session,
      refreshToken: null,
    };
    await expect(
      unauthorizedRecoveryHandler(new ApiError('Unauthorized', { statusCode: 401 })),
    ).resolves.toBeNull();

    sessionState.session = {
      accessToken: 'auth0-token',
      refreshToken: 'auth0-refresh',
      authMethod: 'auth0',
      user: {
        email: 'auth0@example.com',
        role: 'PATIENT',
        isActive: true,
      },
    };
    refreshAuth0Session.mockRejectedValueOnce(new Error('refresh failed'));

    await expect(
      unauthorizedRecoveryHandler(new ApiError('Unauthorized', { statusCode: 401 })),
    ).resolves.toBeNull();
  });

  it('hydrates stores, syncs the authenticated user and registers push notifications', async () => {
    sessionState.session = {
      accessToken: 'session-token',
      refreshToken: 'refresh-token',
      authMethod: 'auth0',
      user: {
        id: 'user-1',
        email: 'before@example.com',
        role: 'PATIENT',
        isActive: false,
      },
    };
    sessionState.profile = { id: 'profile-2' };

    await renderAppProviders();

    expect(sessionState.hydrate).toHaveBeenCalled();
    expect(triageState.hydrate).toHaveBeenCalled();
    expect(getCurrentAuthUser).toHaveBeenCalled();
    expect(sessionState.setSession).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          id: 'user-auth',
          email: 'user@example.com',
          isActive: true,
        }),
      }),
      sessionState.profile,
    );
    expect(registerPushNotifications).toHaveBeenCalled();
  });

  it('clears the session when auth sync fails with 401 or 403 and ignores other errors', async () => {
    const { ApiError: RuntimeApiError } = (await import('@/src/services/api/api-error')) as {
      ApiError: typeof ApiError;
    };

    sessionState.session = {
      accessToken: 'session-token',
      refreshToken: 'refresh-token',
      authMethod: 'auth0',
      user: {
        email: 'before@example.com',
        role: 'PATIENT',
        isActive: true,
      },
    };

    getCurrentAuthUser.mockRejectedValueOnce(
      new RuntimeApiError('Forbidden', { statusCode: 403 }),
    );
    await renderAppProviders();

    expect(queryClientClear).toHaveBeenCalled();
    expect(sessionState.clearSession).toHaveBeenCalled();

    jest.clearAllMocks();
    effectCleanups.length = 0;
    getLastNotificationResponseAsync.mockResolvedValue(null);
    addNotificationResponseReceivedListener.mockReturnValue({
      remove: notificationRemove,
    });
    sessionState.clearSession.mockResolvedValue(undefined);
    getCurrentAuthUser.mockRejectedValueOnce(new Error('boom'));

    await renderAppProviders();

    expect(queryClientClear).not.toHaveBeenCalled();
    expect(sessionState.clearSession).not.toHaveBeenCalled();
  });

  it('navigates using notification deep links from initial and live responses', async () => {
    getLastNotificationResponseAsync.mockResolvedValue({
      notification: {
        request: {
          content: {
            data: {
              deepLink: '/followups/1',
            },
          },
        },
      },
    });

    await renderAppProviders();

    expect(routerPush).toHaveBeenCalledWith('/followups/1');

    const notificationListener = addNotificationResponseReceivedListener.mock.calls[0][0] as (
      response: unknown,
    ) => void;

    notificationListener({
      notification: {
        request: {
          content: {
            data: {
              deepLink: '/consultations/2',
            },
          },
        },
      },
    });
    notificationListener(null);
    notificationListener({
      notification: {
        request: {
          content: {
            data: {
              deepLink: '',
            },
          },
        },
      },
    });

    expect(routerPush).toHaveBeenCalledWith('/consultations/2');
    expect(routerPush).toHaveBeenCalledTimes(2);
  });
});
