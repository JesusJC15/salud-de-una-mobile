import axios, { AxiosHeaders } from 'axios';

import { appConfig } from '@/src/config/env';
import { ApiError } from '@/src/services/api/api-error';
import { createCorrelationId } from '@/src/services/api/request-context';

type AccessTokenResolver = () => Promise<string | null> | string | null;

let accessTokenResolver: AccessTokenResolver | null = null;

export function setApiAccessTokenResolver(resolver: AccessTokenResolver | null) {
  accessTokenResolver = resolver;
}

export const apiClient = axios.create({
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

  if (accessTokenResolver) {
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
  (error: unknown) => Promise.reject(ApiError.fromUnknown(error))
);