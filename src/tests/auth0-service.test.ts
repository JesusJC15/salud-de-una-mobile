import * as AuthSession from 'expo-auth-session';

import {
  AUTH0_DISCOVERY,
  decodeTokenClaims,
  makeAuth0RedirectUri,
  provisionPatient,
  refreshAuth0Session,
} from '@/src/services/auth/auth0-service';

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'saluddeunamobile://callback'),
  refreshAsync: jest.fn(async () => ({ accessToken: 'next-token' })),
}));

jest.mock('@/src/config/env', () => ({
  appConfig: {
    apiBaseUrl: 'https://api.test/v1',
    appEnv: 'development',
    auth0Domain: 'auth0.test',
    auth0ClientId: 'client-123',
    auth0Audience: 'audience-123',
  },
}));

const buildToken = (payload: Record<string, unknown>) => {
  const json = JSON.stringify(payload);
  const base64 = Buffer.from(json).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return ['header', base64, 'signature'].join('.');
};

describe('auth0-service', () => {
  const originalAtob = global.atob;
  const originalFetch = global.fetch;

  beforeAll(() => {
    global.atob = (value: string) => Buffer.from(value, 'base64').toString('binary');
  });

  afterAll(() => {
    global.atob = originalAtob;
    global.fetch = originalFetch;
  });

  it('builds the Auth0 discovery document', () => {
    expect(AUTH0_DISCOVERY.authorizationEndpoint).toBe('https://auth0.test/authorize');
    expect(AUTH0_DISCOVERY.tokenEndpoint).toBe('https://auth0.test/oauth/token');
  });

  it('builds a redirect uri via AuthSession', () => {
    const redirectUri = makeAuth0RedirectUri();

    expect(AuthSession.makeRedirectUri).toHaveBeenCalledWith({
      scheme: 'saluddeunamobile',
      path: 'callback',
    });
    expect(redirectUri).toBe('saluddeunamobile://callback');
  });

  it('decodes auth0 token claims', () => {
    const token = buildToken({
      sub: 'auth0|abc',
      email: 'patient@example.com',
      'https://salud-de-una.com/db_id': 'db-1',
      'https://salud-de-una.com/role': 'PATIENT',
      'https://salud-de-una.com/is_active': true,
    });

    const claims = decodeTokenClaims(token);

    expect(claims).toEqual({
      sub: 'auth0|abc',
      email: 'patient@example.com',
      dbId: 'db-1',
      role: 'PATIENT',
      isActive: true,
    });
  });

  it('returns empty claims on invalid token', () => {
    expect(decodeTokenClaims('invalid')).toEqual({ sub: '' });
  });

  it('returns empty claims when payload cannot be parsed as JSON', () => {
    const malformedPayload = Buffer.from('{"sub":').toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    expect(decodeTokenClaims(`header.${malformedPayload}.signature`)).toEqual({
      sub: '',
    });
  });

  it('refreshes auth0 session', async () => {
    const result = await refreshAuth0Session('refresh-123');

    expect(AuthSession.refreshAsync).toHaveBeenCalledWith(
      { clientId: 'client-123', refreshToken: 'refresh-123' },
      AUTH0_DISCOVERY,
    );
    expect(result).toEqual({ accessToken: 'next-token' });
  });

  it('provisions a patient profile', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ id: 'p1' }),
    })) as unknown as typeof fetch;

    const result = await provisionPatient('token-123', {
      firstName: 'Ana',
      lastName: 'Gomez',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.test/v1/auth/provision/patient',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-123',
        },
        body: JSON.stringify({ firstName: 'Ana', lastName: 'Gomez' }),
      }
    );
    expect(result).toEqual({ id: 'p1' });
  });

  it('throws when provisioning fails', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
    })) as unknown as typeof fetch;

    await expect(
      provisionPatient('token-123', { firstName: 'Ana', lastName: 'Gomez' })
    ).rejects.toThrow('No se pudo completar el registro del paciente');
  });

  it('reads email from namespace claim when payload.email is absent', () => {
    const token = buildToken({
      sub: 'auth0|xyz',
      'https://salud-de-una.com/email': 'ns@example.com',
      'https://salud-de-una.com/db_id': 'db-2',
    });

    const claims = decodeTokenClaims(token);

    expect(claims.email).toBe('ns@example.com');
    expect(claims.dbId).toBe('db-2');
  });

  it('returns undefined email when neither source is present', () => {
    const token = buildToken({ sub: 'auth0|noemail' });

    const claims = decodeTokenClaims(token);

    expect(claims.email).toBeUndefined();
  });

  it('uses empty string sub fallback when sub is missing from payload', () => {
    const token = buildToken({ email: 'a@b.com' });

    const claims = decodeTokenClaims(token);

    expect(claims.sub).toBe('');
    expect(claims.email).toBe('a@b.com');
  });

  it('uses empty clientId fallback when config is missing it', async () => {
    jest.resetModules();
    const refreshAsync = jest.fn(async () => ({ accessToken: 'next-token' }));

    jest.doMock('expo-web-browser', () => ({
      maybeCompleteAuthSession: jest.fn(),
    }));
    jest.doMock('expo-auth-session', () => ({
      makeRedirectUri: jest.fn(() => 'saluddeunamobile://callback'),
      refreshAsync,
    }));
    jest.doMock('@/src/config/env', () => ({
      appConfig: {
        apiBaseUrl: 'https://api.test/v1',
        appEnv: 'development',
        auth0Domain: 'auth0.test',
        auth0ClientId: undefined,
        auth0Audience: 'audience-123',
      },
    }));

    const module = await import('@/src/services/auth/auth0-service');
    await module.refreshAuth0Session('refresh-456');

    expect(refreshAsync).toHaveBeenCalledWith(
      { clientId: '', refreshToken: 'refresh-456' },
      module.AUTH0_DISCOVERY,
    );
  });

  it('uses empty api base url fallback when config omits apiBaseUrl', async () => {
    jest.resetModules();

    jest.doMock('expo-web-browser', () => ({
      maybeCompleteAuthSession: jest.fn(),
    }));
    jest.doMock('expo-auth-session', () => ({
      makeRedirectUri: jest.fn(() => 'saluddeunamobile://callback'),
      refreshAsync: jest.fn(async () => ({ accessToken: 'next-token' })),
    }));
    jest.doMock('@/src/config/env', () => ({
      appConfig: {
        apiBaseUrl: undefined,
        appEnv: 'development',
        auth0Domain: 'auth0.test',
        auth0ClientId: 'client-123',
        auth0Audience: 'audience-123',
      },
    }));

    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ id: 'p2' }),
    })) as unknown as typeof fetch;

    const module = await import('@/src/services/auth/auth0-service');
    await module.provisionPatient('token-456', {
      firstName: 'Ana',
      lastName: 'Gomez',
    });

    expect(global.fetch).toHaveBeenCalledWith('/v1/auth/provision/patient', expect.any(Object));
  });
});
