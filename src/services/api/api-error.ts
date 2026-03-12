import axios, { isAxiosError } from 'axios';

type ApiErrorPayload = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  correlation_id?: string;
};

export class ApiError extends Error {
  statusCode?: number;
  correlationId?: string;
  details?: unknown;

  constructor(message: string, options?: { statusCode?: number; correlationId?: string; details?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = options?.statusCode;
    this.correlationId = options?.correlationId;
    this.details = options?.details;
  }

  private static buildRequestUrl(baseURL?: string, url?: string) {
    if (!baseURL && !url) {
      return undefined;
    }

    try {
      if (baseURL || url) {
        return axios.getUri({
          baseURL,
          url,
        });
      }

      return baseURL ?? url;
    } catch {
      return [baseURL, url].filter(Boolean).join('');
    }
  }

  private static buildNetworkErrorMessage(requestUrl?: string) {
    if (!requestUrl) {
      return 'No fue posible conectar con la API. Verifica que el backend este levantado y que la URL configurada sea accesible desde la app.';
    }

    const usesLoopback = requestUrl.includes('localhost') || requestUrl.includes('127.0.0.1');

    if (usesLoopback) {
      return `No fue posible conectar con la API en ${requestUrl}. Si la app corre en emulador o dispositivo, localhost apunta al propio dispositivo, no a tu PC.`;
    }

    return `No fue posible conectar con la API en ${requestUrl}. Verifica que el backend este levantado y accesible desde la red actual.`;
  }

  static fromUnknown(error: unknown) {
    if (error instanceof ApiError) {
      return error;
    }

    if (isAxiosError<ApiErrorPayload>(error)) {
      const payload = error.response?.data;
      const requestUrl = this.buildRequestUrl(error.config?.baseURL, error.config?.url);

      if (!error.response && error.code === 'ERR_NETWORK') {
        return new ApiError(this.buildNetworkErrorMessage(requestUrl), {
          details: {
            code: error.code,
            requestUrl,
          },
        });
      }

      const rawMessage = payload?.message ?? error.message;
      const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;

      return new ApiError(message, {
        statusCode: payload?.statusCode ?? error.response?.status,
        correlationId: payload?.correlation_id,
        details: {
          payload,
          requestUrl,
        },
      });
    }

    if (error instanceof Error) {
      return new ApiError(error.message, { details: error });
    }

    return new ApiError('Unexpected API error.', { details: error });
  }
}