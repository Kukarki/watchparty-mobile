import React from 'react';
import { router } from 'expo-router';
import ShopScreen from '../../avatar/screens/ShopScreen';

export default function AvatarShopRoute() {
  return <ShopScreen onClose={() => router.back()} />;
}
