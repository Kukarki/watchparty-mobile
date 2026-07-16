// Single icon source for the whole app — no emoji in chrome.
// Uses @expo/vector-icons, which ships with Expo (no install needed).
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { c } from './tokens';

export default function Icon({ name, size = 20, color = c.text, style }) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}

// Semantic names used across screens -> Ionicons names.
export const I = {
  home: 'home', homeOff: 'home-outline',
  rooms: 'tv', roomsOff: 'tv-outline',
  play: 'game-controller', playOff: 'game-controller-outline',
  profile: 'person-circle', profileOff: 'person-circle-outline',
  settings: 'settings-outline',
  more: 'ellipsis-horizontal',
  back: 'chevron-back',
  next: 'chevron-forward',
  down: 'chevron-down',
  close: 'close',
  add: 'add',
  plus: 'add-circle-outline',
  join: 'enter-outline',
  share: 'share-social-outline',
  copy: 'copy-outline',
  edit: 'create-outline',
  trash: 'trash-outline',
  leave: 'exit-outline',
  report: 'flag-outline',
  block: 'ban-outline',
  gift: 'gift-outline',
  message: 'chatbubble-ellipses-outline',
  invite: 'person-add-outline',
  music: 'musical-notes',
  musicOff: 'musical-notes-outline',
  pause: 'pause',
  playFill: 'play',
  skip: 'play-skip-forward',
  queue: 'list-outline',
  search: 'search',
  bell: 'notifications-outline',
  lock: 'lock-closed-outline',
  eye: 'eye-outline',
  moon: 'moon-outline',
  disk: 'server-outline',
  help: 'help-circle-outline',
  info: 'information-circle-outline',
  shield: 'shield-checkmark-outline',
  sync: 'sync-outline',
  star: 'star',
  starOff: 'star-outline',
  trophy: 'trophy-outline',
  coin: 'ellipse',
  fire: 'flame',
  check: 'checkmark',
  people: 'people-outline',
  mic: 'mic-outline',
  volume: 'volume-high-outline',
  bookmark: 'bookmark-outline',
  compass: 'compass-outline',
  qr: 'qr-code-outline',
  link: 'link-outline',
  cards: 'albums-outline',
  brain: 'bulb-outline',
  dice: 'dice-outline',
};
