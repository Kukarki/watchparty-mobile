import { Tabs } from 'expo-router';
import TabBar5 from '../../../wp-home/TabBar5';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar5 {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="rooms" />
      <Tabs.Screen name="games" />
      <Tabs.Screen name="music" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="friends" options={{ href: null }} />
    </Tabs>
  );
}
