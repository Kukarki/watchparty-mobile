import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  NotificationsScreen, PrivacyScreen, PlaybackScreen,
  AppearanceScreen, StorageScreen, HelpScreen, AboutScreen,
} from '../../../wp-ui';

const SCREENS: Record<string, React.ComponentType<any>> = {
  notifications: NotificationsScreen,
  privacy: PrivacyScreen,
  playback: PlaybackScreen,
  appearance: AppearanceScreen,
  storage: StorageScreen,
  help: HelpScreen,
  about: AboutScreen,
};

export default function PrefRoute() {
  const { pref } = useLocalSearchParams<{ pref: string }>();
  const Screen = SCREENS[pref ?? ''];

  if (!Screen) {
    router.back();
    return null;
  }

  return <Screen onBack={() => router.back()} />;
}
