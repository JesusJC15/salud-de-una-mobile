const axiosGet = jest.fn();
const isAxiosError = jest.fn(() => false);

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => axiosGet(...args),
  },
  get: (...args: unknown[]) => axiosGet(...args),
  isAxiosError,
}));

const loadModule = async (apiBaseUrl: string | null) => {
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

  return import('@/src/services/api/connectivity');
};

describe('checkApiConnectivity', () => {
  beforeEach(() => {
    axiosGet.mockReset();
  });

  it('throws when api base url is missing', async () => {
    const { checkApiConnectivity } = await loadModule(null);

    await expect(checkApiConnectivity()).rejects.toThrow('EXPO_PUBLIC_API_URL no esta configurada.');
  });

  it('returns reachable true when request succeeds', async () => {
    axiosGet.mockResolvedValue({ status: 204 });
    const { checkApiConnectivity } = await loadModule('https://api.test/v1');

    const result = await checkApiConnectivity();

    expect(axiosGet).toHaveBeenCalledWith('https://api.test/v1', {
      timeout: 6000,
      validateStatus: expect.any(Function),
    });
    expect(result).toEqual({
      apiBaseUrl: 'https://api.test/v1',
      message: 'API alcanzable. Respondio con 204.',
      reachable: true,
      statusCode: 204,
    });
  });

  it('returns non-2xx message when API responds with error status', async () => {
    axiosGet.mockResolvedValue({ status: 500 });
    const { checkApiConnectivity } = await loadModule('https://api.test/v1');

    const result = await checkApiConnectivity();

    expect(result).toEqual({
      apiBaseUrl: 'https://api.test/v1',
      message: 'API alcanzable. Respondio con 500; eso sigue confirmando conectividad de red.',
      reachable: true,
      statusCode: 500,
    });
  });

  it('maps failures to reachable false', async () => {
    axiosGet.mockRejectedValue(new Error('Network down'));
    const { checkApiConnectivity } = await loadModule('https://api.test/v1');

    const result = await checkApiConnectivity();

    expect(result.reachable).toBe(false);
    expect(result.message).toBe('Network down');
  });
});
