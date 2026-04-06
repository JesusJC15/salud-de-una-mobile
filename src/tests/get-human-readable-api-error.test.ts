import { describe, expect, it } from '@jest/globals';

import { getHumanReadableApiError } from '@/src/lib/get-human-readable-api-error';

describe('getHumanReadableApiError', () => {
  it('returns Error message directly', () => {
    const error = new Error('Fallo de red controlado');

    expect(getHumanReadableApiError(error)).toBe('Fallo de red controlado');
  });

  it('joins backend messages when response contains an array', () => {
    const error = {
      response: {
        data: {
          message: ['Campo email invalido', 'Campo password requerido'],
        },
      },
    };

    expect(getHumanReadableApiError(error)).toBe('Campo email invalido, Campo password requerido');
  });

  it('falls back to default copy for unknown errors', () => {
    expect(getHumanReadableApiError(null)).toBe('Ocurrio un error inesperado. Intenta nuevamente.');
  });
});
