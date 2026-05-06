import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { appConfig } from '@/src/config/env';
import { UserProfile } from '@/src/types/user';

WebBrowser.maybeCompleteAuthSession();

const NS = 'https://salud-de-una.com/';

export const AUTH0_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `https://${appConfig.auth0Domain}/authorize`,
  tokenEndpoint: `https://${appConfig.auth0Domain}/oauth/token`,
  revocationEndpoint: `https://${appConfig.auth0Domain}/oauth/revoke`,
};

export function makeAuth0RedirectUri() {
  return AuthSession.makeRedirectUri({ scheme: 'saluddeunamobile', path: 'callback' });
}

export interface Auth0TokenClaims {
  sub: string;
  email?: string;
  dbId?: string;
  role?: string;
  isActive?: boolean;
}

/** Decodes the payload of an Auth0 JWT (client-side only, no signature verification). */
export function decodeTokenClaims(accessToken: string): Auth0TokenClaims {
  try {
    const parts = accessToken.split('.');
    if (parts.length < 2) return { sub: '' };
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
    return {
      sub: (payload.sub as string) ?? '',
      email: payload.email as string | undefined ?? payload[`${NS}email`] as string | undefined,
      dbId: payload[`${NS}db_id`] as string | undefined,
      role: payload[`${NS}role`] as string | undefined,
      isActive: payload[`${NS}is_active`] as boolean | undefined,
    };
  } catch {
    return { sub: '' };
  }
}

/** Refreshes Auth0 tokens using the stored refresh token. */
export async function refreshAuth0Session(refreshToken: string) {
  return AuthSession.refreshAsync(
    {
      clientId: appConfig.auth0ClientId ?? '',
      refreshToken,
    },
    AUTH0_DISCOVERY,
  );
}

/** Calls the backend provision endpoint after Auth0 signup (patient). */
export async function provisionPatient(
  accessToken: string,
  data: {
    firstName: string;
    lastName: string;
    birthDate?: string;
    gender?: string;
  },
): Promise<UserProfile> {
  const baseUrl = appConfig.apiBaseUrl?.replace(/\/v1$/, '') ?? '';
  const res = await fetch(`${baseUrl}/v1/auth/provision/patient`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('No se pudo completar el registro del paciente');
  }

  return res.json() as Promise<UserProfile>;
}
