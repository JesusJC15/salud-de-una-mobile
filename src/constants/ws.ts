import { appConfig } from '@/src/config/env';

function trimTrailingSlashes(url: string): string {
  let end = url.length;
  while (end > 0 && url[end - 1] === '/') end--;
  return end === url.length ? url : url.slice(0, end);
}

export const WS_BASE_URL = trimTrailingSlashes(
  (appConfig.apiBaseUrl ?? 'http://localhost:3000').replace(/\/v1$/, ''),
);
