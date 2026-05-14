import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY = 'salud-de-una.shown-notifications';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type DedupEntry = {
  id: string;
  shownAt: number;
};

async function readEntries(): Promise<DedupEntry[]> {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    } else {
      raw = await SecureStore.getItemAsync(STORAGE_KEY);
    }
    if (!raw) return [];
    return JSON.parse(raw) as DedupEntry[];
  } catch {
    return [];
  }
}

async function writeEntries(entries: DedupEntry[]): Promise<void> {
  try {
    const raw = JSON.stringify(entries);
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, raw);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEY, raw);
    }
  } catch {
    // Storage failure is non-critical
  }
}

function pruneOldEntries(entries: DedupEntry[]): DedupEntry[] {
  const cutoff = Date.now() - MAX_AGE_MS;
  return entries.filter((e) => e.shownAt > cutoff);
}

export async function hasShownNotification(id: string): Promise<boolean> {
  const entries = await readEntries();
  return entries.some((e) => e.id === id);
}

export async function markNotificationShown(id: string): Promise<void> {
  const entries = await readEntries();
  if (entries.some((e) => e.id === id)) return;
  const pruned = pruneOldEntries(entries);
  await writeEntries([...pruned, { id, shownAt: Date.now() }]);
}
