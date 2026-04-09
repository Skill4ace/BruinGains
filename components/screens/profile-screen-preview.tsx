import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { getWeeklyActivityCards, getWeeklySummary } from '@/data/local/selectors';
import { useAppData } from '@/providers/app-data-provider';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';
import { SurfaceCard } from '@/components/ui/surface-card';
import { AppColors, Layout, Radii, Spacing } from '@/constants/theme';

export function ProfileScreenPreview() {
  const { width } = useWindowDimensions();
  const { state } = useAppData();
  const visibleWeeks = getWeeklyActivityCards(state).filter(
    (week) => new Date(week.startDate) <= new Date(),
  );
  const summary = getWeeklySummary(state);
  const [activeWeek, setActiveWeek] = useState(Math.max(visibleWeeks.length - 1, 0));
  const cardWidth = Math.min(width - Layout.pagePadding * 2, Layout.maxContentWidth);

  const handleWeekEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
    setActiveWeek(page);
  };

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="headline">Profile</AppText>
      </View>

      <View style={styles.stack}>
        <PressScale>
          <SurfaceCard tone="low" style={styles.goalsCard}>
            <View style={styles.goalHeaderRow}>
              <AppText variant="micro" dimmed>
                Goals
              </AppText>
              <Ionicons name="chevron-forward" size={16} color={AppColors.textSubtle} />
            </View>

            <View style={styles.goalSections}>
              <View style={styles.goalSection}>
                <AppText variant="label" dimmed>
                  Diet
                </AppText>
                <View style={styles.goalMetricsRow}>
                  <GoalMetric
                    icon="flame-outline"
                    color="#1D1F24"
                    label="Calories"
                    value={`${state.goals.calories.toLocaleString()} kcal`}
                  />
                  <GoalMetric
                    icon="food-drumstick"
                    color="#E76F6A"
                    label="Protein"
                    value={`${state.goals.protein}g`}
                    material
                  />
                  <GoalMetric
                    icon="peanut"
                    color="#5B8EE6"
                    label="Fats"
                    value={`${state.goals.fats}g`}
                    material
                  />
                  <GoalMetric
                    icon="bread-slice"
                    color="#E2A061"
                    label="Carbs"
                    value={`${state.goals.carbs}g`}
                    material
                  />
                </View>
              </View>

              <View style={styles.goalDivider} />

              <View style={styles.goalSection}>
                <AppText variant="label" dimmed>
                  Gym
                </AppText>
                <View style={styles.gymGoalRow}>
                  <View style={styles.gymGoalLeft}>
                    <Ionicons name="barbell-outline" size={16} color={AppColors.primary} />
                    <AppText variant="body" dimmed>
                      Workouts
                    </AppText>
                  </View>
                  <AppText variant="bodyStrong">{state.goals.workoutsPerWeek} / week</AppText>
                </View>
              </View>
            </View>
          </SurfaceCard>
        </PressScale>
      </View>

      <View style={styles.stack}>
        <ScrollView
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleWeekEnd}>
          {visibleWeeks.map((week) => (
            <View key={week.id} style={[styles.weekPage, { width: cardWidth }]}>
              <SurfaceCard floating style={styles.weekCard}>
                <View style={styles.weekHeader}>
                  <AppText variant="eyebrow" color={AppColors.textMuted}>
                    {week.label}
                  </AppText>
                  <View style={styles.legendCompact}>
                    <LegendIcon color={AppColors.primary} icon="barbell-outline" />
                    <LegendIcon color={AppColors.secondary} icon="restaurant-outline" />
                  </View>
                </View>

                <View style={styles.summaryGrid}>
                  {summary.map((item) => (
                    <View key={item.id} style={styles.summaryStat}>
                      <AppText variant="micro" dimmed>
                        {item.label}
                      </AppText>
                      <AppText variant="headline">{item.value}</AppText>
                    </View>
                  ))}
                </View>

                <View style={styles.weekDaysRow}>
                  {week.days.map((day) => (
                    <View key={day.id} style={styles.dayColumn}>
                      <AppText variant="micro" dimmed>
                        {day.day}
                      </AppText>
                      <AppText variant="label" dimmed>
                        {day.date}
                      </AppText>
                      <View style={styles.dotStack}>
                        <DayDot filled={day.workout} color={AppColors.primary} />
                        <DayDot filled={day.nutrition} color={AppColors.secondary} />
                      </View>
                    </View>
                  ))}
                </View>
              </SurfaceCard>
            </View>
          ))}
        </ScrollView>

        <View style={styles.pageDots}>
          {visibleWeeks.map((week, index) => (
            <View key={week.id} style={[styles.pageDot, activeWeek === index ? styles.pageDotActive : null]} />
          ))}
        </View>
      </View>

      <View style={styles.stack}>
        <AppText variant="title">Achievements</AppText>
        <View style={styles.achievementGrid}>
          {state.achievements.map((achievement) => (
            <SurfaceCard key={achievement.id} style={styles.achievementCard}>
              <View style={styles.achievementTopLine}>
                <View
                  style={[
                    styles.achievementIcon,
                    achievement.tone === 'nutrition' ? styles.achievementIconNutrition : styles.achievementIconWorkout,
                  ]}>
                  <Ionicons
                    name={achievement.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={AppColors.white}
                  />
                </View>
                <View
                  style={[
                    styles.achievementBadge,
                    achievement.tone === 'nutrition' ? styles.achievementBadgeNutrition : styles.achievementBadgeWorkout,
                  ]}>
                  <AppText
                    variant="micro"
                    color={achievement.tone === 'nutrition' ? '#8A6500' : AppColors.primary}>
                    {achievement.tone === 'nutrition' ? 'Nutrition' : 'Workout'}
                  </AppText>
                </View>
              </View>
              <View style={styles.achievementCopy}>
                <AppText variant="bodyStrong">{achievement.title}</AppText>
                <AppText variant="body" dimmed>
                  {achievement.detail}
                </AppText>
                <AppText variant="micro" dimmed>
                  Earned {achievement.date}
                </AppText>
              </View>
            </SurfaceCard>
          ))}
        </View>
      </View>
    </AppScreen>
  );
}

function LegendIcon({
  color,
  icon,
}: {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={[styles.legendIconWrap, { backgroundColor: `${color}1A` }]}>
      <Ionicons name={icon} size={12} color={color} />
    </View>
  );
}

function GoalMetric({
  icon,
  color,
  label,
  value,
  material = false,
}: {
  icon: string;
  color: string;
  label: string;
  value: string;
  material?: boolean;
}) {
  return (
    <View style={styles.goalMetric}>
      <View style={styles.goalMetricTop}>
        {material ? (
          <MaterialCommunityIcons name={icon as never} size={14} color={color} />
        ) : (
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={14} color={color} />
        )}
        <AppText variant="micro" dimmed>
          {label}
        </AppText>
      </View>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}

function DayDot({
  filled,
  color,
}: {
  filled: boolean;
  color: string;
}) {
  return (
    <View
      style={[
        styles.dayDot,
        {
          borderColor: color,
          backgroundColor: filled ? color : 'transparent',
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.sm,
  },
  header: {
    paddingTop: Spacing.xs,
  },
  stack: {
    gap: Spacing.md,
  },
  goalsCard: {
    gap: Spacing.lg,
  },
  goalSections: {
    gap: Spacing.lg,
  },
  goalSection: {
    gap: Spacing.md,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  goalMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  goalMetric: {
    flex: 1,
    gap: Spacing.xs,
  },
  goalMetricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalDivider: {
    height: 1,
    backgroundColor: AppColors.outlineVariant,
  },
  gymGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  gymGoalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  weekPage: {
    gap: Spacing.sm,
  },
  weekCard: {
    gap: Spacing.lg,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  legendCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendIconWrap: {
    width: 26,
    height: 26,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  summaryStat: {
    flex: 1,
    gap: Spacing.xs,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  dayColumn: {
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  dotStack: {
    alignItems: 'center',
    gap: 6,
    paddingTop: Spacing.xs,
  },
  dayDot: {
    width: 11,
    height: 11,
    borderRadius: Radii.pill,
    borderWidth: 1.5,
  },
  pageDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: Radii.pill,
    backgroundColor: '#E3E5EA',
  },
  pageDotActive: {
    backgroundColor: AppColors.text,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  achievementCard: {
    width: '48%',
    gap: Spacing.md,
    minHeight: 188,
  },
  achievementTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIconWorkout: {
    backgroundColor: AppColors.primary,
  },
  achievementIconNutrition: {
    backgroundColor: AppColors.secondary,
  },
  achievementBadge: {
    minHeight: 24,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementBadgeWorkout: {
    backgroundColor: 'rgba(39, 116, 174, 0.12)',
  },
  achievementBadgeNutrition: {
    backgroundColor: 'rgba(254, 204, 0, 0.22)',
  },
  achievementCopy: {
    gap: Spacing.xs,
  },
});
