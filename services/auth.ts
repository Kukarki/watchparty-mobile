import * as SecureStore from 'expo-secure-store';
import { authApi } from './api';
import { User } from '@/types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export async function saveSession(token: string, user: User) {
  // Bug fix #8: rollback token if the second write fails to avoid a partial session
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (error) {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    throw error;
  }
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function login(email: string, password: string) {
  const { data } = await authApi.login(email, password);
  await saveSession(data.token, data.user);
  return data.user as User;
}

export async function register(email: string, password: string, username: string) {
  const { data } = await authApi.register(email, password, username);
  await saveSession(data.token, data.user);
  return data.user as User;
}

export async function loginAsGuest(username: string) {
  const { data } = await authApi.guest(username);
  await saveSession(data.token, data.user);
  return data.user as User;
}

export async function logout() {
  await clearSession();
}
