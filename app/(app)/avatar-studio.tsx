import { Redirect } from 'expo-router';

// expo-gl (WebGL) is not available in Expo Go SDK 56 — redirect to the
// DiceBear avatar editor which has no native-module dependency.
export default function AvatarStudioRoute() {
  return <Redirect href="/(app)/avatar-editor" />;
}
