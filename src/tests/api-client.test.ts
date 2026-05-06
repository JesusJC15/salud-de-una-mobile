import { AxiosHeaders } from 'axios';

const requestHandlers: Array<(config: Record<string, unknown>) => Promise<Record<string, unknown>>> = [];
const responseHandlers: Array<(error: unknown) => Promise<unknown>> = [];

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');

  // Build mocks inline without referencing external variables
  const mockApiClient = Object.assign(jest.fn(), {
    interceptors: {
      request: {
        use: jest.fn((handler: (config: Record<string, unknown>) => Promise<Record<string, unknown>>) => {
          requestHandlers.push(handler);
        }),
      },
      response: {
        use: jest.fn((_: unknown, handler: (error: unknown) => Promise<unknown>) => {
          responseHandlers.push(handler);
        }),
      },
    },
  });

  const mockCreate = jest.fn(() => mockApiClient);
  const mockIsAxiosError = jest.fn(() => true);

  // Store globally for test access
  (global as any).__test_mockApiClient = mockApiClient;
  (global as any).__test_mockCreate = mockCreate;
  (global as any).__test_mockIsAxiosError = mockIsAxiosError;

  return {
    __esModule: true,
    default: {
      create: mockCreate,
      getUri: actual.default?.getUri ?? actual.getUri,
    },
    create: mockCreate,
    AxiosHeaders: actual.AxiosHeaders,
    isAxiosError: mockIsAxiosError,
  };
});

jest.mock('@/src/services/api/request-context', () => ({
  createCorrelationId: jest.fn(() => 'cid-123'),
}));

const loadModule = async (apiBaseUrl: string | null) => {
  requestHandlers.length = 0;
  responseHandlers.length = 0;
  const mockApiClient = (global as any).__test_mockApiClient;
  const mockCreate = (global as any).__test_mockCreate;
  const mockIsAxiosError = (global as any).__test_mockIsAxiosError;
  if (mockApiClient) mockApiClient.mockReset();
  if (mockCreate) mockCreate.mockClear();
  if (mockIsAxiosError) mockIsAxiosError.mockReset();

  jest.resetModules();
  jest.doMock('@/src/config/env', () => ({
    appConfig: {
      apiBaseUrl,
      appEnv: 'development',
      auth0Domain: null,
      auth0ClientId: null,
      auth0Audience: null,
    },
  }));

  return import('@/src/services/api/client');
};

describe('apiClient interceptors', () => {
  const getMocks = () => ({
    apiClient: (global as any).__test_mockApiClient,
    create: (global as any).__test_mockCreate,
    isAxiosError: (global as any).__test_mockIsAxiosError,
  });
  it('adds correlation and authorization headers', async () => {
    const {
      setApiAccessTokenResolver,
    } = await loadModule('https://api.test/v1');

    setApiAccessTokenResolver(() => 'access-token');

    const config = await requestHandlers[0]({ headers: {} });
    const headers = config.headers as AxiosHeaders;

    expect(headers.get('x-correlation-id')).toBe('cid-123');
    expect(headers.get('Authorization')).toBe('Bearer access-token');
  });

  it('skips authorization when access token resolver returns null', async () => {
    const { setApiAccessTokenResolver } = await loadModule('https://api.test/v1');

    setApiAccessTokenResolver(() => null);

    const config = await requestHandlers[0]({ headers: {} });
    const headers = config.headers as AxiosHeaders;

    expect(headers.get('Authorization')).toBeUndefined();
  });

  it('does not resolve tokens when skipAuthRefresh is true', async () => {
    const { setApiAccessTokenResolver } = await loadModule('https://api.test/v1');

    const resolver = jest.fn(() => 'token');
    setApiAccessTokenResolver(resolver);

    const config = await requestHandlers[0]({ headers: {}, skipAuthRefresh: true });
    const headers = config.headers as AxiosHeaders;

    expect(resolver).not.toHaveBeenCalled();
    expect(headers.get('Authorization')).toBeUndefined();
  });

  it('throws when api base url is missing', async () => {
    await loadModule(null);

    await expect(requestHandlers[0]({ headers: {} })).rejects.toThrow(
      'EXPO_PUBLIC_API_URL is not configured. Set it to your backend base URL including /v1.'
    );
  });

  it('rejects non-axios errors without retrying', async () => {
    const { isAxiosError, apiClient } = getMocks();
    await loadModule('https://api.test/v1');
    isAxiosError?.mockReturnValueOnce(false);

    await expect(responseHandlers[0](new Error('boom'))).rejects.toBeInstanceOf(Error);
    expect(apiClient).not.toHaveBeenCalled();
  });

  it('rejects axios errors without config', async () => {
    const { isAxiosError, apiClient } = getMocks();
    await loadModule('https://api.test/v1');
    isAxiosError?.mockReturnValueOnce(true);

    await expect(responseHandlers[0]({ isAxiosError: true })).rejects.toBeInstanceOf(Error);
    expect(apiClient).not.toHaveBeenCalled();
  });

  it('rejects 403 responses without retrying', async () => {
    const { apiClient } = getMocks();
    await loadModule('https://api.test/v1');

    const error = {
      isAxiosError: true,
      response: { status: 403 },
      config: { headers: {} },
    };

    await expect(responseHandlers[0](error)).rejects.toBeInstanceOf(Error);
    expect(apiClient).not.toHaveBeenCalled();
  });

  it('rejects when the original request already retried', async () => {
    const { apiClient } = getMocks();
    await loadModule('https://api.test/v1');

    const error = {
      isAxiosError: true,
      response: { status: 401 },
      config: { headers: {}, _retry: true },
    };

    await expect(responseHandlers[0](error)).rejects.toBeInstanceOf(Error);
    expect(apiClient).not.toHaveBeenCalled();
  });

  it('rejects when skipAuthRefresh is set on the original request', async () => {
    const { apiClient } = getMocks();
    await loadModule('https://api.test/v1');

    const error = {
      isAxiosError: true,
      response: { status: 401 },
      config: { headers: {}, skipAuthRefresh: true },
    };

    await expect(responseHandlers[0](error)).rejects.toBeInstanceOf(Error);
    expect(apiClient).not.toHaveBeenCalled();
  });

  it('rejects when no unauthorized recovery handler is configured', async () => {
    const { apiClient } = getMocks();
    await loadModule('https://api.test/v1');

    const error = {
      isAxiosError: true,
      response: { status: 401 },
      config: { headers: {}, _retry: false },
    };

    await expect(responseHandlers[0](error)).rejects.toBeInstanceOf(Error);
    expect(apiClient).not.toHaveBeenCalled();
  });

  it('retries on 401 and applies refreshed token', async () => {
    const {
      setApiUnauthorizedRecoveryHandler,
      setApiUnauthorizedSessionHandler,
      apiClient,
    } = await loadModule('https://api.test/v1');

    const sessionHandler = jest.fn();
    setApiUnauthorizedRecoveryHandler(() => 'next-token');
    setApiUnauthorizedSessionHandler(sessionHandler);

    const { apiClient: mockApiClientInstance } = getMocks();
    mockApiClientInstance?.mockResolvedValue({ data: { ok: true } });

    const error = {
      isAxiosError: true,
      response: { status: 401 },
      config: { headers: new AxiosHeaders(), _retry: false },
    };

    const result = await responseHandlers[0](error);

    expect(apiClient).toHaveBeenCalledTimes(1);
    const [requestConfig] = mockApiClientInstance?.mock.calls[0];
    const headers = requestConfig.headers as AxiosHeaders;

    expect(headers.get('Authorization')).toBe('Bearer next-token');
    expect(sessionHandler).not.toHaveBeenCalled();
    expect(result).toEqual({ data: { ok: true } });
  });

  it('invokes session handler when refresh returns null', async () => {
    const {
      setApiUnauthorizedRecoveryHandler,
      setApiUnauthorizedSessionHandler,
    } = await loadModule('https://api.test/v1');

    const sessionHandler = jest.fn();
    setApiUnauthorizedRecoveryHandler(() => null);
    setApiUnauthorizedSessionHandler(sessionHandler);

    const error = {
      isAxiosError: true,
      response: { status: 401 },
      config: { headers: new AxiosHeaders(), _retry: false },
    };

    await expect(responseHandlers[0](error)).rejects.toBeInstanceOf(Error);
    expect(sessionHandler).toHaveBeenCalledTimes(1);
  });

  it('invokes session handler when recovery throws', async () => {
    const {
      setApiUnauthorizedRecoveryHandler,
      setApiUnauthorizedSessionHandler,
    } = await loadModule('https://api.test/v1');

    const sessionHandler = jest.fn();
    setApiUnauthorizedRecoveryHandler(() => {
      throw new Error('refresh failed');
    });
    setApiUnauthorizedSessionHandler(sessionHandler);

    const error = {
      isAxiosError: true,
      response: { status: 401 },
      config: { headers: new AxiosHeaders(), _retry: false },
    };

    await expect(responseHandlers[0](error)).rejects.toBeInstanceOf(Error);
    expect(sessionHandler).toHaveBeenCalledTimes(1);
  });

  it('handles concurrent 401 errors with single refresh', async () => {
    const {
      setApiUnauthorizedRecoveryHandler,
      setApiUnauthorizedSessionHandler,
      apiClient,
    } = await loadModule('https://api.test/v1');

    let callCount = 0;
    const sessionHandler = jest.fn();
    setApiUnauthorizedRecoveryHandler(() => {
      callCount++;
      return new Promise((resolve) => setTimeout(() => resolve('refreshed-token'), 10));
    });
    setApiUnauthorizedSessionHandler(sessionHandler);

    const { apiClient: mockApiClientInstance } = getMocks();
    mockApiClientInstance?.mockResolvedValue({ data: { ok: true } });

    const error = {
      isAxiosError: true,
      response: { status: 401 },
      config: { headers: new AxiosHeaders(), _retry: false },
    };

    // Send two concurrent 401 errors
    const results = await Promise.all([
      responseHandlers[0](error).catch(() => null),
      responseHandlers[0](error).catch(() => null),
    ]);

    // Recovery handler should only be called once (shared refreshInFlight)
    expect(callCount).toBe(1);
    expect(sessionHandler).not.toHaveBeenCalled();
  });
});
