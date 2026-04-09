import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { AppColors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: AppColors.background,
        },
        tabBarButton: HapticTab,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: AppColors.white,
        tabBarInactiveTintColor: AppColors.textSubtle,
        tabBarIconStyle: {
          marginBottom: -1,
        },
        tabBarLabelStyle: {
          ...Typography.tabLabel,
          marginTop: 2,
        },
        tabBarItemStyle: {
          borderRadius: Radii.pill,
          marginHorizontal: 3,
          marginVertical: 3,
          minHeight: 52,
          overflow: 'hidden',
        },
        tabBarActiveBackgroundColor: AppColors.primary,
        tabBarStyle: {
          position: 'absolute',
          left: Spacing.md,
          right: Spacing.md,
          bottom: Spacing.md,
          height: 72,
          paddingTop: 7,
          paddingBottom: 7,
          paddingHorizontal: 7,
          backgroundColor: AppColors.surfaceLowest,
          borderTopWidth: 0,
          borderRadius: Radii.pill,
          overflow: 'hidden',
          ...Shadows.floating,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dining',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={22} name={focused ? 'restaurant' : 'restaurant-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gym"
        options={{
          title: 'Gym',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={22} name={focused ? 'barbell' : 'barbell-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={22} name={focused ? 'person-circle' : 'person-circle-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
