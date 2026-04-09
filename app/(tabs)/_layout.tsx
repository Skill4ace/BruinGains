import { Tabs } from 'expo-router';

import { AppTabBar } from '@/components/ui/app-tab-bar';
import { AppColors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: AppColors.background,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dining' }} />
      <Tabs.Screen name="gym" options={{ title: 'Gym' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
