import { Redirect, Tabs } from 'expo-router';

import { AppTabBar } from '@/components/ui/app-tab-bar';
import { AppColors } from '@/constants/theme';
import { useAppData } from '@/providers/app-data-provider';

export default function TabLayout() {
  const { isOnboardingComplete } = useAppData();

  if (!isOnboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

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
