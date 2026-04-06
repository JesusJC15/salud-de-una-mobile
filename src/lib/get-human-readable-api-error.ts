type MessageContainer = {
  message?: string | string[];
};

type ErrorWithResponseData = {
  response?: {
    data?: MessageContainer;
  };
};

function hasResponseData(value: unknown): value is ErrorWithResponseData {
  return typeof value === 'object' && value !== null && 'response' in value;
}

function normalizeMessage(message: string | string[] | undefined) {
  if (typeof message === 'string') {
    return message;
  }

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return null;
}

export function getHumanReadableApiError(error: unknown, fallback = 'Ocurrio un error inesperado. Intenta nuevamente.') {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (hasResponseData(error)) {
    const parsed = normalizeMessage(error.response?.data?.message);

    if (parsed) {
      return parsed;
    }
  }

  return fallback;
}
