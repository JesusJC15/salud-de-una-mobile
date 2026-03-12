import { z } from 'zod';

function normalizeApiBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
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
});

const runtimeConfig = runtimeConfigSchema.parse({
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  appEnv: process.env.EXPO_PUBLIC_APP_ENV,
});

export const appConfig = {
  apiBaseUrl: runtimeConfig.apiUrl ?? null,
  appEnv: runtimeConfig.appEnv,
};

export type AppConfig = typeof appConfig;