import Constants from 'expo-constants';

function getDevServerHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    '';

  return hostUri.split(':')[0] || 'localhost';
}

const BACKEND_ORIGIN = `http://${getDevServerHost()}:4000`;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? `${BACKEND_ORIGIN}/api/v1`;

export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ?? BACKEND_ORIGIN;

// ─── Design tokens ────────────────────────────────────────────────────────────

export const COLORS = {
  // Backgrounds (3 surface tiers, darkest → lightest)
  background:   '#09090f',   // app shell
  card:         '#111118',   // cards, panels
  cardElevated: '#1c1c26',   // inputs, chips, modals

  // Accent — warm amber/gold (the signature color)
  primary:      '#F5A623',
  primaryLight: '#FBBF4A',
  primaryDark:  '#C8861A',
  accentMuted:  'rgba(245,166,35,0.14)',

  // Legacy alias kept so no other file needs touching
  secondary:    '#2563eb',
  accent:       '#F5A623',

  // Text (3 tiers)
  textPrimary:   '#F8FAFC',  // headings, active labels
  textSecondary: '#94A3B8',  // subtitles, meta
  muted:         '#4B5563',  // placeholders, timestamps, dim

  // Borders
  border:        '#1e1e2a',
  borderStrong:  '#2d2d3d',

  // Semantic
  danger:  '#EF4444',
  success: '#22C55E',        // online indicator
  warning: '#F59E0B',

  // Overlays
  overlay: 'rgba(0,0,0,0.75)',
} as const;

// Spacing scale (4-pt base)
export const SPACE = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

// Corner radii
export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;

// Elevation / shadow presets
export const SHADOW = {
  accent: {
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;

export const EMOJI_REACTIONS = [
  // Hype
  '🔥', '🎉', '🚀', '⚡', '💥', '🎊', '🏆', '👑',
  // Love / emotion
  '❤️', '😍', '🥰', '💯', '✨', '💫', '🌟', '💖',
  // Reactions
  '👍', '👏', '🙌', '🤩', '😂', '😭', '😮', '😱',
  // Fun
  '💀', '🤣', '😤', '🫡', '🥹', '😎', '🤯', '🍿',
];

export const SOCKET_EVENTS = {
  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',
  ROOM_JOINED: 'room:joined',
  ROOM_ERROR: 'room:error',
  VIDEO_STATE: 'video:state',
  VIDEO_PLAY: 'video:play',
  VIDEO_PAUSE: 'video:pause',
  VIDEO_SEEK: 'video:seek',
  VIDEO_CHANGE_URL: 'video:change_url',
  CHAT_MESSAGE: 'chat:message',
  CHAT_REACTION: 'chat:reaction',
  MEMBER_JOINED: 'room:member_joined',
  MEMBER_LEFT: 'room:member_left',
  MEMBERS_UPDATE: 'members-update',
  VOICE_JOIN: 'voice:join',
  VOICE_LEAVE: 'voice:leave',
  WEBRTC_OFFER: 'voice:offer',
  WEBRTC_ANSWER: 'voice:answer',
  WEBRTC_ICE: 'voice:ice_candidate',
  QUEUE_UPDATE: 'queue-update',
  POLL_UPDATE: 'poll-update',
  CHAT_TYPING: 'chat:typing',
  CHAT_STOP_TYPING: 'chat:stop_typing',
  SCREEN_SHARE_START: 'screenshare:start',
  SCREEN_SHARE_STOP: 'screenshare:stop',
} as const;
