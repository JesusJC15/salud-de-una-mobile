import axios from 'axios';

import { appConfig } from '@/src/config/env';
import { ApiError } from '@/src/services/api/api-error';

export type ApiConnectivityCheckResult = {
  apiBaseUrl: string;
  message: string;
  reachable: boolean;
  statusCode?: number;
};

export async function checkApiConnectivity(): Promise<ApiConnectivityCheckResult> {
  if (!appConfig.apiBaseUrl) {
    throw new ApiError('EXPO_PUBLIC_API_URL no esta configurada.');
  }

  try {
    const response = await axios.get(appConfig.apiBaseUrl, {
      timeout: 6000,
      validateStatus: () => true,
    });

    return {
      apiBaseUrl: appConfig.apiBaseUrl,
      message:
        response.status >= 200 && response.status < 400
          ? `API alcanzable. Respondio con ${response.status}.`
          : `API alcanzable. Respondio con ${response.status}; eso sigue confirmando conectividad de red.`,
      reachable: true,
      statusCode: response.status,
    };
  } catch (error) {
    const apiError = ApiError.fromUnknown(error);

    return {
      apiBaseUrl: appConfig.apiBaseUrl,
      message: apiError.message,
      reachable: false,
      statusCode: apiError.statusCode,
    };
  }
}
