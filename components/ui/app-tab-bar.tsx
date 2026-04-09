import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';
import { AppColors, Radii, Shadows, Spacing } from '@/constants/theme';

const TAB_META = {
  index: {
    label: 'Dining',
    activeIcon: 'restaurant',
    inactiveIcon: 'restaurant-outline',
  },
  gym: {
    label: 'Gym',
    activeIcon: 'barbell',
    inactiveIcon: 'barbell-outline',
  },
  profile: {
    label: 'Profile',
    activeIcon: 'person-circle',
    inactiveIcon: 'person-circle-outline',
  },
} as const;

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeArea, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const options = descriptors[route.key]?.options;
          const meta = TAB_META[route.name as keyof typeof TAB_META];

          if (!meta) {
            return null;
          }

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const accessibilityLabel = options?.tabBarAccessibilityLabel ?? options?.title ?? meta.label;

          return (
            <View key={route.key} style={styles.slot}>
              <PressScale onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
                <View style={[styles.item, focused ? styles.itemActive : styles.itemInactive]}>
                  <Ionicons
                    size={22}
                    name={focused ? meta.activeIcon : meta.inactiveIcon}
                    color={focused ? AppColors.white : AppColors.textSubtle}
                  />
                  <AppText variant="tabLabel" color={focused ? AppColors.white : AppColors.textSubtle}>
                    {meta.label}
                  </AppText>
                </View>
              </PressScale>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: AppColors.surfaceLowest,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.outlineVariant,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingHorizontal: Spacing.lg,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
  },
  item: {
    minHeight: 56,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: Spacing.xxl,
  },
  itemActive: {
    backgroundColor: AppColors.primary,
    minWidth: 128,
    ...Shadows.soft,
  },
  itemInactive: {
    minWidth: 92,
    backgroundColor: 'transparent',
  },
});
