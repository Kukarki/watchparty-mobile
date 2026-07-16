import { router } from 'expo-router';
import StudioScreen from '../../avatar/screens/StudioScreen';

export default function AvatarStudioRoute() {
  return (
    <StudioScreen
      onClose={() => router.back()}
      onSaved={() => router.back()}
    />
  );
}
