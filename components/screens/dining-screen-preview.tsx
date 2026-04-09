import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';
import { ProgressRing } from '@/components/ui/progress-ring';
import { SurfaceCard } from '@/components/ui/surface-card';
import { diningPreview } from '@/constants/preview-data';
import { AppColors, Layout, Radii, Spacing } from '@/constants/theme';

const PERIODS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'lateNight', label: 'Late Night' },
] as const;

const DINING_HALL_PRIORITY = ['bruin-plate', 'de-neve', 'epicuria-covel'] as const;

type PeriodKey = (typeof PERIODS)[number]['key'];

const MACRO_META = {
  protein: { key: 'protein', color: '#E76F6A' },
  carbs: { key: 'carbs', color: '#E2A061' },
  fats: { key: 'fats', color: '#5B8EE6' },
} as const;

export function DiningScreenPreview() {
  const { width } = useWindowDimensions();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>(getCurrentPeriod());
  const [activeSlide, setActiveSlide] = useState(0);

  const cardWidth = Math.min(width - Layout.pagePadding * 2, Layout.maxContentWidth);

  const hallsForPeriod = useMemo(() => {
    return diningPreview.halls
      .filter((hall) => Boolean(hall.hours[selectedPeriod]))
      .sort((a, b) => {
      const aPriority = DINING_HALL_PRIORITY.indexOf(a.id as (typeof DINING_HALL_PRIORITY)[number]);
      const bPriority = DINING_HALL_PRIORITY.indexOf(b.id as (typeof DINING_HALL_PRIORITY)[number]);
      const normalizedAPriority = aPriority === -1 ? Number.MAX_SAFE_INTEGER : aPriority;
      const normalizedBPriority = bPriority === -1 ? Number.MAX_SAFE_INTEGER : bPriority;

      if (normalizedAPriority !== normalizedBPriority) {
        return normalizedAPriority - normalizedBPriority;
      }

      return a.name.localeCompare(b.name);
      });
  }, [selectedPeriod]);

  const handleSlideEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
    setActiveSlide(page);
  };

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="headline">Dining</AppText>
      </View>

      <View style={styles.carouselWrap}>
        <ScrollView
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleSlideEnd}
        >
          <View style={[styles.page, { width: cardWidth }]}>
            <SurfaceCard floating style={styles.breakdownCard}>
              <View style={styles.breakdownTop}>
                <View style={styles.breakdownCopy}>
                  <AppText variant="micro" dimmed>
                    Calories
                  </AppText>
                  <AppText variant="headline">
                    {diningPreview.calories.toLocaleString()}/{diningPreview.calorieGoal.toLocaleString()}
                  </AppText>
                </View>
                <IconRing
                  progress={diningPreview.calories / diningPreview.calorieGoal}
                  color={AppColors.text}
                  icon="flame"
                  size={74}
                  strokeWidth={8}
                />
              </View>

              <View style={styles.breakdownRows}>
                <BreakdownRow
                  label="Protein"
                  value={`${diningPreview.protein}/${diningPreview.proteinGoal}g`}
                  progress={diningPreview.protein / diningPreview.proteinGoal}
                  iconKey={MACRO_META.protein.key}
                  color={MACRO_META.protein.color}
                />
                <BreakdownRow
                  label="Carbs"
                  value={`${diningPreview.carbs}/${diningPreview.carbGoal}g`}
                  progress={diningPreview.carbs / diningPreview.carbGoal}
                  iconKey={MACRO_META.carbs.key}
                  color={MACRO_META.carbs.color}
                />
                <BreakdownRow
                  label="Fats"
                  value={`${diningPreview.fats}/${diningPreview.fatGoal}g`}
                  progress={diningPreview.fats / diningPreview.fatGoal}
                  iconKey={MACRO_META.fats.key}
                  color={MACRO_META.fats.color}
                />
              </View>
            </SurfaceCard>
          </View>

          <View style={[styles.page, { width: cardWidth }]}>
            <SurfaceCard floating style={styles.loggedMealsCard}>
              <View style={styles.loggedMealsHeader}>
                <View style={styles.loggedMealsHeaderCopy}>
                  <AppText variant="title">Logged meals</AppText>
                  <View style={styles.loggedMealsBadge}>
                    <AppText variant="label" color={AppColors.primary}>
                      {diningPreview.recentMeals.length} today
                    </AppText>
                  </View>
                </View>
                <PressScale haptic="none">
                  <View style={styles.customMealButton}>
                    <Ionicons name="add" size={18} color={AppColors.primary} />
                  </View>
                </PressScale>
              </View>
              <View style={styles.loggedMealsList}>
                {diningPreview.recentMeals.map((meal, index) => (
                  <View key={meal.id} style={[styles.loggedMealRow, index < diningPreview.recentMeals.length - 1 ? styles.rowSpacing : null]}>
                    <View style={styles.loggedMealCopy}>
                      <AppText variant="bodyStrong">{meal.title}</AppText>
                      <AppText variant="micro" dimmed>
                        {meal.meta}
                      </AppText>
                    </View>
                    <AppText variant="title" color={AppColors.primary}>
                      {meal.calories}
                    </AppText>
                  </View>
                ))}
              </View>
            </SurfaceCard>
          </View>
        </ScrollView>

        <View style={styles.pageDots}>
          {[0, 1].map((index) => (
            <View key={index} style={[styles.pageDot, activeSlide === index ? styles.pageDotActive : null]} />
          ))}
        </View>
      </View>

      <View style={styles.stack}>
        <View style={styles.periodGrid}>
          {PERIODS.map((period) => (
            <PeriodChip
              key={period.key}
              label={period.label}
              selected={period.key === selectedPeriod}
              onPress={() => setSelectedPeriod(period.key)}
            />
          ))}
        </View>
        <View style={styles.list}>
          {hallsForPeriod.map((hall) => (
            <HallRow key={hall.id} hall={hall} selectedPeriod={selectedPeriod} />
          ))}
        </View>
      </View>
    </AppScreen>
  );
}

function PeriodChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <PressScale onPress={onPress} containerStyle={styles.periodChipPress}>
      <View style={[styles.periodChip, selected ? styles.periodChipSelected : styles.periodChipDefault]}>
        <AppText variant="label" color={selected ? AppColors.white : AppColors.textMuted}>
          {label}
        </AppText>
      </View>
    </PressScale>
  );
}

function IconRing({
  progress,
  color,
  icon,
  size,
  strokeWidth = 10,
}: {
  progress: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  size: number;
  strokeWidth?: number;
}) {
  return (
    <View style={[styles.iconRingWrap, { width: size, height: size }]}>
      <ProgressRing
        progress={progress}
        value=""
        unit=""
        caption=""
        size={size}
        strokeWidth={strokeWidth}
        color={color}
        trackColor="#ECECF4"
        hideLabel
      />
      <View style={styles.iconRingCenter}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
    </View>
  );
}

function BreakdownRow({
  label,
  value,
  progress,
  iconKey,
  color,
}: {
  label: string;
  value: string;
  progress: number;
  iconKey: keyof typeof MACRO_META;
  color: string;
}) {
  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownMain}>
        <View style={styles.breakdownTopRow}>
          <View style={styles.breakdownLeft}>
            <MacroIcon iconKey={iconKey} color={color} />
            <AppText variant="body" dimmed>
              {label}
            </AppText>
          </View>
          <AppText variant="body">{value}</AppText>
        </View>
        <View style={styles.breakdownBarTrack}>
          <View style={[styles.breakdownBarFill, { width: `${Math.max(0, Math.min(progress, 1)) * 100}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

function MacroIcon({
  iconKey,
  color,
}: {
  iconKey: keyof typeof MACRO_META;
  color: string;
}) {
  if (iconKey === 'protein') {
    return <MaterialCommunityIcons name="food-drumstick" size={14} color={color} />;
  }

  if (iconKey === 'carbs') {
    return <MaterialCommunityIcons name="bread-slice" size={14} color={color} />;
  }

  return <MaterialCommunityIcons name="peanut" size={14} color={color} />;
}

function HallRow({
  hall,
  selectedPeriod,
}: {
  hall: (typeof diningPreview.halls)[number];
  selectedPeriod: PeriodKey;
}) {
  const hours = hall.hours[selectedPeriod];

  return (
    <PressScale haptic="none">
      <SurfaceCard style={styles.hallCard}>
        <Image source={hall.imageSource} style={styles.hallImage} contentFit="contain" transition={150} />
        <View style={styles.hallCopy}>
          <AppText variant="title">{hall.name}</AppText>
          <AppText dimmed>{hours}</AppText>
        </View>
        <View style={styles.hallMeta}>
          <View style={styles.hallMetaValue}>
            <View style={styles.hallMetaCopy}>
              <AppText variant="headline" color={AppColors.primary}>
                {hall.fitPercent}%
              </AppText>
              <AppText variant="micro" dimmed>
                full
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={AppColors.textSubtle} />
          </View>
        </View>
      </SurfaceCard>
    </PressScale>
  );
}

function getCurrentPeriod(date = new Date()): PeriodKey {
  const hour = date.getHours() + date.getMinutes() / 60;

  if (hour >= 6 && hour < 10.5) {
    return 'breakfast';
  }

  if (hour >= 10.5 && hour < 15.5) {
    return 'lunch';
  }

  if (hour >= 15.5 && hour < 21) {
    return 'dinner';
  }

  return 'lateNight';
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.sm,
  },
  header: {
    paddingTop: Spacing.xs,
  },
  carouselWrap: {
    gap: Spacing.md,
  },
  page: {
    gap: Spacing.sm,
  },
  calorieCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.lg,
  },
  iconRingWrap: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRingCenter: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedMealsCard: {
    minHeight: 280,
    gap: Spacing.lg,
  },
  loggedMealsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  loggedMealsHeaderCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    flex: 1,
  },
  loggedMealsBadge: {
    minHeight: 32,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md,
    backgroundColor: AppColors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customMealButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedMealsList: {
    gap: Spacing.md,
  },
  loggedMealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  loggedMealCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  breakdownCard: {
    gap: Spacing.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  breakdownTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.lg,
  },
  breakdownCopy: {
    gap: Spacing.sm,
    flex: 1,
  },
  breakdownRows: {
    gap: Spacing.lg,
  },
  breakdownRow: {
    gap: Spacing.sm,
  },
  breakdownMain: {
    gap: Spacing.md,
  },
  breakdownTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  breakdownBarTrack: {
    height: 4,
    borderRadius: Radii.pill,
    overflow: 'hidden',
    backgroundColor: '#ECECF4',
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: Radii.pill,
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
  stack: {
    gap: Spacing.md,
  },
  periodGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  periodChipPress: {
    flex: 1,
  },
  periodChip: {
    width: '100%',
    minHeight: 50,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  periodChipDefault: {
    backgroundColor: AppColors.surfaceLow,
  },
  periodChipSelected: {
    backgroundColor: AppColors.primary,
  },
  list: {
    gap: Spacing.md,
  },
  hallCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  hallImage: {
    width: 52,
    height: 52,
    borderRadius: Radii.md,
    backgroundColor: AppColors.surfaceLow,
  },
  hallCopy: {
    flex: 1,
    gap: 4,
  },
  hallMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 102,
  },
  hallMetaValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  hallMetaCopy: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rowSpacing: {
    paddingBottom: Spacing.md,
  },
});
