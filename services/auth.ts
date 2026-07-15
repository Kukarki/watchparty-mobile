import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { authApi } from './api';
import { User } from '@/types';

const SUPABASE_URL = 'https://kujeurfxcztsgkbpnysk.supabase.co';

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

export async function loginWithGoogle(): Promise<User> {
  // Hardcoded to match exactly what's registered in Supabase dashboard
  const redirectUrl = 'watchparty://auth/callback';
  const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

  if (result.type !== 'success') {
    throw new Error('Google sign-in was cancelled');
  }

  // Parse access_token from URL hash or query string
  const parsed = Linking.parse(result.url);
  const hash = result.url.split('#')[1] ?? '';
  const hashParams = new URLSearchParams(hash);
  const accessToken =
    hashParams.get('access_token') ??
    (parsed.queryParams?.access_token as string | undefined);

  if (!accessToken) throw new Error('No access token returned from Google');

  const { data } = await authApi.supabaseCallback(accessToken);
  await saveSession(data.token, data.user);
  return data.user as User;
}
