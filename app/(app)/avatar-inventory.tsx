import React from 'react';
import { router } from 'expo-router';
import InventoryScreen from '../../avatar/screens/InventoryScreen';

export default function AvatarInventoryRoute() {
  return <InventoryScreen onClose={() => router.back()} />;
}
