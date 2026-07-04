import * as SecureStore from 'expo-secure-store';

export interface HistoryEntry {
  id: string;
  name: string;
  code: string;
  at: string;
}

const KEY = 'watch_history_v1';
const MAX = 12;

export async function addToHistory(entry: Omit<HistoryEntry, 'at'>): Promise<void> {
  const list = await getHistory();
  const deduped = list.filter((h) => h.id !== entry.id);
  const updated: HistoryEntry[] = [
    { ...entry, at: new Date().toISOString() },
    ...deduped,
  ].slice(0, MAX);
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(updated));
  } catch {}
}

export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
