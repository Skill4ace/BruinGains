import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatWorkoutTimerLabel, getActiveWorkoutSessionView } from '@/data/local/selectors';
import { useAppData } from '@/providers/app-data-provider';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';
import { AppColors, Radii, Shadows, Spacing } from '@/constants/theme';
import { useEffect, useState } from 'react';

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
  const router = useRouter();
  const { state: appState } = useAppData();
  const activeWorkout = getActiveWorkoutSessionView(appState);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    if (!activeWorkout) {
      return;
    }

    const timer = setInterval(() => {
      setClock(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [activeWorkout]);

  return (
    <View style={[styles.safeArea, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {activeWorkout ? (
        <PressScale haptic="none" onPress={() => router.push('/workout/session')}>
          <View style={styles.resumeBar}>
            <View style={styles.resumeHandle} />
            <View style={styles.resumeContent}>
              <View style={styles.resumeCopy}>
                <AppText variant="bodyStrong">{activeWorkout.session.title}</AppText>
                <AppText variant="micro" dimmed>
                  Active workout
                </AppText>
              </View>
              <View style={styles.resumeMeta}>
                <AppText variant="label" color={AppColors.primary}>
                  {formatWorkoutTimerLabel(
                    activeWorkout.session.startedAt,
                    clock,
                    activeWorkout.session.endedAt,
                  )}
                </AppText>
                <Ionicons name="chevron-up" size={16} color={AppColors.primary} />
              </View>
            </View>
          </View>
        </PressScale>
      ) : null}
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
  resumeBar: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: AppColors.surface,
    ...Shadows.floating,
  },
  resumeHandle: {
    width: 56,
    height: 5,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceHighest,
    alignSelf: 'center',
  },
  resumeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  resumeCopy: {
    flex: 1,
    gap: 2,
  },
  resumeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
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
