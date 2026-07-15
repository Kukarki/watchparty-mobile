import { API_BASE_URL } from '@/constants';

/**
 * Warn at startup if the API URL is not HTTPS in a production build.
 * Expo's __DEV__ flag is true during `expo start` and false in production builds.
 */
export function enforceHttps() {
  if (!__DEV__ && !API_BASE_URL.startsWith('https://')) {
    console.warn(
      `[Security] API_BASE_URL should use HTTPS in production. Got: ${API_BASE_URL}`
    );
  }
}

/**
 * Strips any characters that could be used for script injection before
 * passing user-supplied strings to the API or chat socket.
 * This is a shallow guard; the backend must also sanitise inputs.
 */
export function sanitizeInput(value: string): string {
  return value
    .replace(/[<>]/g, '') // strip angle brackets (XSS guard)
    .trim()
    .slice(0, 2000);      // hard cap on length
}

/**
 * Very basic URL allow-list: only accept http/https schemes for video URLs
 * so users can't pass javascript: or data: URIs to the video player.
 */
export function isAllowedVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
