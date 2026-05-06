import { AxiosHeaders, isAxiosError, create } from 'axios';

import { appConfig } from '@/src/config/env';
import { ApiError } from '@/src/services/api/api-error';
import { createCorrelationId } from '@/src/services/api/request-context';

type AccessTokenResolver = () => Promise<string | null> | string | null;
type UnauthorizedRecoveryHandler = (error: ApiError) => Promise<string | null> | string | null;
type UnauthorizedSessionHandler = () => Promise<void> | void;

let accessTokenResolver: AccessTokenResolver | null = null;
let unauthorizedRecoveryHandler: UnauthorizedRecoveryHandler | null = null;
let unauthorizedSessionHandler: UnauthorizedSessionHandler | null = null;
let refreshInFlight: Promise<string | null> | null = null;

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
    skipAuthRefresh?: boolean;
  }

  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
    skipAuthRefresh?: boolean;
  }
}

export function setApiAccessTokenResolver(resolver: AccessTokenResolver | null) {
  accessTokenResolver = resolver;
}

export function setApiUnauthorizedRecoveryHandler(handler: UnauthorizedRecoveryHandler | null) {
  unauthorizedRecoveryHandler = handler;
}

export function setApiUnauthorizedSessionHandler(handler: UnauthorizedSessionHandler | null) {
  unauthorizedSessionHandler = handler;
}

export const apiClient = create({
  baseURL: appConfig.apiBaseUrl ?? undefined,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  if (!appConfig.apiBaseUrl) {
    throw new ApiError('EXPO_PUBLIC_API_URL is not configured. Set it to your backend base URL including /v1.');
  }

  const headers = AxiosHeaders.from(config.headers ?? {});

  headers.set('x-correlation-id', createCorrelationId());

  if (accessTokenResolver && !config.skipAuthRefresh) {
    const accessToken = await accessTokenResolver();

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  config.headers = headers;

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const apiError = ApiError.fromUnknown(error);

    if (!isAxiosError(error) || !error.config) {
      return Promise.reject(apiError);
    }

    const statusCode = error.response?.status ?? apiError.statusCode;
    const originalRequest = error.config;

    if (
      statusCode !== 401
      || originalRequest._retry
      || originalRequest.skipAuthRefresh
      || !unauthorizedRecoveryHandler
    ) {
      return Promise.reject(apiError);
    }

    originalRequest._retry = true;

    try {
      refreshInFlight ??= Promise.resolve(unauthorizedRecoveryHandler(apiError)).finally(() => {
        refreshInFlight = null;
      });

      const nextAccessToken = await refreshInFlight;

      if (!nextAccessToken) {
        await unauthorizedSessionHandler?.();
        return Promise.reject(apiError);
      }

      const headers = AxiosHeaders.from(originalRequest.headers ?? {});
      headers.set('Authorization', `Bearer ${nextAccessToken}`);
      originalRequest.headers = headers;

      return apiClient(originalRequest);
    } catch (recoveryError) {
      await unauthorizedSessionHandler?.();
      return Promise.reject(ApiError.fromUnknown(recoveryError));
    }
  }
);