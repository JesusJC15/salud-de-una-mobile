import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TRIAGE_KEY = 'salud-de-una.patient.triage';

async function write(value: string | null) {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return;
    value === null
      ? localStorage.removeItem(TRIAGE_KEY)
      : localStorage.setItem(TRIAGE_KEY, value);
    return;
  }
  value === null
    ? await SecureStore.deleteItemAsync(TRIAGE_KEY)
    : await SecureStore.setItemAsync(TRIAGE_KEY, value);
}

async function read(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(TRIAGE_KEY) : null;
  }
  return SecureStore.getItemAsync(TRIAGE_KEY);
}

export async function persistConsultationId(id: string | null): Promise<void> {
  await write(id);
}

export async function readStoredConsultationId(): Promise<string | null> {
  return read();
}
