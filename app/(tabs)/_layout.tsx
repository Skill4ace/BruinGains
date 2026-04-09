import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { AppColors, Radii, Typography } from '@/constants/theme';

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
          borderRadius: Radii.md,
          marginHorizontal: 6,
          marginVertical: 6,
          minHeight: 52,
          overflow: 'hidden',
        },
        tabBarActiveBackgroundColor: AppColors.primary,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 84,
          paddingTop: 6,
          paddingBottom: 10,
          paddingHorizontal: 10,
          backgroundColor: AppColors.surfaceLowest,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: AppColors.outlineVariant,
          borderRadius: 0,
          elevation: 0,
          shadowOpacity: 0,
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
