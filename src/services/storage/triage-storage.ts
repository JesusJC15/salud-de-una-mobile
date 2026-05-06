import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TRIAGE_KEY = 'salud-de-una.patient.triage';

async function write(value: string | null) {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return;
    if (value === null) {
      localStorage.removeItem(TRIAGE_KEY);
    } else {
      localStorage.setItem(TRIAGE_KEY, value);
    }
    return;
  }
  if (value === null) {
    await SecureStore.deleteItemAsync(TRIAGE_KEY);
  } else {
    await SecureStore.setItemAsync(TRIAGE_KEY, value);
  }
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
