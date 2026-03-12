import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { PersistedAuthState } from '@/src/store/session-store';

const SESSION_STORAGE_KEY = 'salud-de-una.patient.session';

async function writeValue(value: string | null) {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return;
    }

    if (value === null) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    localStorage.setItem(SESSION_STORAGE_KEY, value);
    return;
  }

  if (value === null) {
    await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
    return;
  }

  await SecureStore.setItemAsync(SESSION_STORAGE_KEY, value);
}

async function readValue() {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(SESSION_STORAGE_KEY);
  }

  return SecureStore.getItemAsync(SESSION_STORAGE_KEY);
}

export async function persistSession(state: PersistedAuthState) {
  await writeValue(JSON.stringify(state));
}

export async function readStoredSession() {
  const rawSession = await readValue();

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as PersistedAuthState;
  } catch {
    await writeValue(null);
    return null;
  }
}

export async function clearStoredSession() {
  await writeValue(null);
}