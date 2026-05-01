import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { z } from 'zod';

function normalizeApiBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

function readExpoHostUri() {
  const expoConfig = Constants.expoConfig as { hostUri?: string } | null;
  const expoGoConfig = Constants as typeof Constants & {
    expoGoConfig?: { debuggerHost?: string | null };
  };

  return expoConfig?.hostUri ?? expoGoConfig.expoGoConfig?.debuggerHost ?? null;
}

function extractHost(value: string | null) {
  if (!value) {
    return null;
  }

  const [hostWithPort] = value.split('/');
  const [host] = hostWithPort.split(':');

  return host || null;
}

function resolveApiBaseUrl(value: string | undefined, appEnv: 'development' | 'preview' | 'production') {
  if (!value) {
    return undefined;
  }

  const normalizedValue = normalizeApiBaseUrl(value);

  if (Platform.OS === 'web' || appEnv !== 'development') {
    return normalizedValue;
  }

  const url = new URL(normalizedValue);
  const isLoopbackHost = ['127.0.0.1', 'localhost'].includes(url.hostname);

  if (!isLoopbackHost) {
    return normalizedValue;
  }

  const expoHost = extractHost(readExpoHostUri());
  const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : null;
  const resolvedHost = expoHost ?? fallbackHost;

  if (!resolvedHost) {
    return normalizedValue;
  }

  url.hostname = resolvedHost;
  return url.toString();
}

function emptyStringToUndefined(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

const runtimeConfigSchema = z.object({
  apiUrl: z.preprocess(
    emptyStringToUndefined,
    z.string().url().transform(normalizeApiBaseUrl).optional()
  ),
  appEnv: z.preprocess(
    emptyStringToUndefined,
    z
      .enum(['development', 'preview', 'production'])
      .default(process.env.NODE_ENV === 'production' ? 'production' : 'development')
  ),
  auth0Domain: z.preprocess(emptyStringToUndefined, z.string().optional()),
  auth0ClientId: z.preprocess(emptyStringToUndefined, z.string().optional()),
  auth0Audience: z.preprocess(emptyStringToUndefined, z.string().optional()),
});

const runtimeConfig = runtimeConfigSchema.parse({
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  appEnv: process.env.EXPO_PUBLIC_APP_ENV,
  auth0Domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN,
  auth0ClientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID,
  auth0Audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE,
});

export const appConfig = {
  apiBaseUrl: resolveApiBaseUrl(runtimeConfig.apiUrl, runtimeConfig.appEnv) ?? null,
  appEnv: runtimeConfig.appEnv,
  auth0Domain: runtimeConfig.auth0Domain ?? null,
  auth0ClientId: runtimeConfig.auth0ClientId ?? null,
  auth0Audience: runtimeConfig.auth0Audience ?? null,
};

export type AppConfig = typeof appConfig;