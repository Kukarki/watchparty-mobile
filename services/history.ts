import * as SecureStore from 'expo-secure-store';

export interface HistoryEntry {
  id: string;
  name: string;
  code: string;
  at: string;
}

const MAX = 12;

function key(userId?: string | null): string {
  return userId ? `watch_history_v2_${userId}` : 'watch_history_v2_guest';
}

export async function addToHistory(
  entry: Omit<HistoryEntry, 'at'>,
  userId?: string | null,
): Promise<void> {
  const list = await getHistory(userId);
  const deduped = list.filter((h) => h.id !== entry.id);
  const updated: HistoryEntry[] = [
    { ...entry, at: new Date().toISOString() },
    ...deduped,
  ].slice(0, MAX);
  try {
    await SecureStore.setItemAsync(key(userId), JSON.stringify(updated));
  } catch {}
}

export async function getHistory(userId?: string | null): Promise<HistoryEntry[]> {
  try {
    const raw = await SecureStore.getItemAsync(key(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearHistory(userId?: string | null): Promise<void> {
  await SecureStore.deleteItemAsync(key(userId));
}
