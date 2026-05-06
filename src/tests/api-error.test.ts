import axios from 'axios';

import { ApiError } from '@/src/services/api/api-error';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    getUri: jest.fn(() => 'https://api.test/v1/foo'),
  },
  getUri: jest.fn(() => 'https://api.test/v1/foo'),
  isAxiosError: jest.fn((value) => (value as { isAxiosError?: boolean }).isAxiosError === true),
}));

describe('ApiError.fromUnknown', () => {
  it('returns the same instance when given an ApiError', () => {
    const input = new ApiError('Known error');

    expect(ApiError.fromUnknown(input)).toBe(input);
  });

  it('maps axios payload data to a typed ApiError', () => {
    const error = {
      isAxiosError: true,
      message: 'Request failed',
      response: {
        status: 400,
        data: {
          message: ['invalid email', 'invalid password'],
          statusCode: 400,
          correlation_id: 'cid-123',
        },
      },
      config: {
        baseURL: 'https://api.test',
        url: '/v1/foo',
      },
    };

    const apiError = ApiError.fromUnknown(error);

    expect(apiError).toBeInstanceOf(ApiError);
    expect(apiError.message).toBe('invalid email, invalid password');
    expect(apiError.statusCode).toBe(400);
    expect(apiError.correlationId).toBe('cid-123');
  });

  it('uses a network message when axios reports ERR_NETWORK', () => {
    const error = {
      isAxiosError: true,
      code: 'ERR_NETWORK',
      message: 'Network Error',
      config: {
        baseURL: 'https://api.test',
        url: '/v1/foo',
      },
    };

    const apiError = ApiError.fromUnknown(error);

    expect(apiError.message).toContain('No fue posible conectar con la API en https://api.test/v1/foo');
    expect(apiError.details).toEqual({
      code: 'ERR_NETWORK',
      requestUrl: 'https://api.test/v1/foo',
    });
  });

  it('uses the loopback network message for localhost urls', () => {
    (axios.getUri as jest.Mock).mockReturnValueOnce('http://localhost:3000/v1/foo');
    const error = {
      isAxiosError: true,
      code: 'ERR_NETWORK',
      message: 'Network Error',
      config: {
        baseURL: 'http://localhost:3000',
        url: '/v1/foo',
      },
    };

    const apiError = ApiError.fromUnknown(error);

    expect(apiError.message).toContain('localhost apunta al propio dispositivo');
  });

  it('uses a generic network message when request url is missing', () => {
    const error = {
      isAxiosError: true,
      code: 'ERR_NETWORK',
      message: 'Network Error',
      config: {},
    };

    const apiError = ApiError.fromUnknown(error);

    expect(apiError.message).toContain('No fue posible conectar con la API');
  });

  it('handles network-like errors without response but with a different code', () => {
    const error = {
      isAxiosError: true,
      code: 'ECONNRESET',
      message: 'Connection reset',
      config: {
        baseURL: 'https://api.test',
        url: '/v1/foo',
      },
    };

    const apiError = ApiError.fromUnknown(error);

    expect(apiError.message).toBe('Connection reset');
    expect(apiError.details).toEqual({
      payload: undefined,
      requestUrl: 'https://api.test/v1/foo',
    });
  });

  it('falls back to error message when payload message is missing', () => {
    const error = {
      isAxiosError: true,
      message: 'Fallback message',
      response: {
        status: 409,
        data: {},
      },
      config: {
        baseURL: 'https://api.test',
        url: '/v1/foo',
      },
    };

    const apiError = ApiError.fromUnknown(error);

    expect(apiError.message).toBe('Fallback message');
    expect(apiError.statusCode).toBe(409);
  });

  it('falls back to concatenated request url when getUri fails', () => {
    (axios.getUri as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Boom');
    });

    const error = {
      isAxiosError: true,
      message: 'Network Error',
      response: {
        status: 500,
        data: { message: 'Server error' },
      },
      config: {
        baseURL: 'https://api.test',
        url: '/v1/foo',
      },
    };

    const apiError = ApiError.fromUnknown(error);

    expect(apiError.details).toEqual({
      payload: { message: 'Server error' },
      requestUrl: 'https://api.test/v1/foo',
    });
  });

  it('wraps non-axios errors', () => {
    const apiError = ApiError.fromUnknown(new Error('Boom'));

    expect(apiError.message).toBe('Boom');
    expect(apiError.details).toBeInstanceOf(Error);
  });

  it('handles non-error values', () => {
    const apiError = ApiError.fromUnknown('unknown');

    expect(apiError.message).toBe('Unexpected API error.');
    expect(apiError.details).toBe('unknown');
  });
});
