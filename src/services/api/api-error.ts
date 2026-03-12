import { isAxiosError } from 'axios';

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

  static fromUnknown(error: unknown) {
    if (error instanceof ApiError) {
      return error;
    }

    if (isAxiosError<ApiErrorPayload>(error)) {
      const payload = error.response?.data;
      const rawMessage = payload?.message ?? error.message;
      const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;

      return new ApiError(message, {
        statusCode: payload?.statusCode ?? error.response?.status,
        correlationId: payload?.correlation_id,
        details: payload,
      });
    }

    if (error instanceof Error) {
      return new ApiError(error.message, { details: error });
    }

    return new ApiError('Unexpected API error.', { details: error });
  }
}