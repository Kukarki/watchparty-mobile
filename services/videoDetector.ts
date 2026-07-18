export type VideoSource =
  | { type: 'youtube'; videoId: string }
  | { type: 'vimeo'; videoId: string }
  | { type: 'twitch'; channel: string; videoId?: string }
  | { type: 'dailymotion'; videoId: string }
  | { type: 'hls'; url: string }
  | { type: 'direct'; url: string };

export function detectVideoSource(url: string): VideoSource | null {
  if (!url?.trim()) return null;
  const u = url.trim();

  // YouTube
  for (const p of [
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
    /youtube\.com\/shorts\/([^?&\s]+)/,
  ]) {
    const m = u.match(p);
    if (m) return { type: 'youtube', videoId: m[1] };
  }

  // Vimeo
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { type: 'vimeo', videoId: vimeo[1] };

  // Twitch VOD
  const twitchVod = u.match(/twitch\.tv\/videos\/(\d+)/);
  if (twitchVod) return { type: 'twitch', channel: '', videoId: twitchVod[1] };

  // Twitch live channel
  const twitchLive = u.match(/twitch\.tv\/([^\/\s?#]+)/);
  if (twitchLive && twitchLive[1] !== 'videos') return { type: 'twitch', channel: twitchLive[1] };

  // Dailymotion
  const dm = u.match(/dailymotion\.com\/video\/([^_\s?#]+)/);
  if (dm) return { type: 'dailymotion', videoId: dm[1] };

  // HLS stream
  if (u.includes('.m3u8')) return { type: 'hls', url: u };

  // Direct video file
  if (/\.(mp4|mkv|webm|mov|avi|m4v|ogv)(\?|#|$)/i.test(u)) return { type: 'direct', url: u };

  return null;
}

export function getSourceLabel(source: VideoSource | null): string {
  if (!source) return 'Unknown';
  const labels: Record<VideoSource['type'], string> = {
    youtube: 'YouTube',
    vimeo: 'Vimeo',
    twitch: 'Twitch',
    dailymotion: 'Dailymotion',
    hls: 'Live Stream',
    direct: 'Video',
  };
  return labels[source.type];
}

export const PLATFORM_ICONS: Record<VideoSource['type'], string> = {
  youtube: '▶',
  vimeo: '🎬',
  twitch: '🟣',
  dailymotion: '🎥',
  hls: '📡',
  direct: '🎞',
};
