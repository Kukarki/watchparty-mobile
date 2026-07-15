// WatchParty avatar feature — mobile entry point.
// NOTE: 3D components (AvatarStage, StudioScreen, QuickCreateScreen) are NOT
// re-exported here to avoid loading expo-gl at app startup. Import them directly
// from their source files inside route screens (Expo Router lazy-loads routes).
export { configureAvatarApi, AvatarApi } from './api';
export { useAvatarStore } from './store';
export { default as InventoryScreen } from './screens/InventoryScreen';
export { default as ShopScreen } from './screens/ShopScreen';
export { SnapshotAvatar, XPBar, ItemCard } from './components';
export * from './theme';
