import Ionicons from '@expo/vector-icons/Ionicons';
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

import { ActionButton } from '@/components/ui/action-button';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';
import { ProgressRing } from '@/components/ui/progress-ring';
import { SectionHeader } from '@/components/ui/section-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { diningPreview } from '@/constants/preview-data';
import { AppColors, Layout, Radii, Spacing } from '@/constants/theme';

const PERIODS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'lateNight', label: 'Late Night' },
] as const;

type PeriodKey = (typeof PERIODS)[number]['key'];

const MACRO_META = {
  protein: { icon: 'flame', color: '#E76F6A' },
  carbs: { icon: 'leaf', color: '#E2A061' },
  fats: { icon: 'water', color: '#5B8EE6' },
} as const;

export function DiningScreenPreview() {
  const { width } = useWindowDimensions();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>(getCurrentPeriod());
  const [activeSlide, setActiveSlide] = useState(0);

  const cardWidth = Math.min(width - Layout.pagePadding * 2, Layout.maxContentWidth);
  const caloriesLeft = Math.max(diningPreview.calorieGoal - diningPreview.calories, 0);

  const hallsForPeriod = useMemo(() => {
    return [...diningPreview.halls].sort((a, b) => {
      const aOpen = Boolean(a.hours[selectedPeriod]);
      const bOpen = Boolean(b.hours[selectedPeriod]);

      if (aOpen !== bOpen) {
        return Number(bOpen) - Number(aOpen);
      }

      return b.fitPercent - a.fitPercent;
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
            <SurfaceCard floating style={styles.calorieCard}>
              <View style={styles.calorieSideStat}>
                <AppText variant="headline">{caloriesLeft}</AppText>
                <AppText variant="micro" dimmed>
                  Calories left
                </AppText>
              </View>
              <View style={styles.calorieCenter}>
                <IconRing
                  progress={diningPreview.calories / diningPreview.calorieGoal}
                  color={AppColors.text}
                  icon="flame"
                  size={108}
                />
                <AppText variant="headline">{diningPreview.calories}</AppText>
                <AppText variant="micro" dimmed>
                  Consumed
                </AppText>
              </View>
              <View style={styles.calorieSideStat}>
                <AppText variant="headline">{diningPreview.calorieGoal}</AppText>
                <AppText variant="micro" dimmed>
                  Target
                </AppText>
              </View>
            </SurfaceCard>

            <View style={styles.macroRow}>
              <MacroMiniCard
                label="Protein left"
                value={`${Math.max(diningPreview.proteinGoal - diningPreview.protein, 0)}g`}
                progress={diningPreview.protein / diningPreview.proteinGoal}
                icon={MACRO_META.protein.icon}
                color={MACRO_META.protein.color}
              />
              <MacroMiniCard
                label="Carbs left"
                value={`${Math.max(diningPreview.carbGoal - diningPreview.carbs, 0)}g`}
                progress={diningPreview.carbs / diningPreview.carbGoal}
                icon={MACRO_META.carbs.icon}
                color={MACRO_META.carbs.color}
              />
              <MacroMiniCard
                label="Fat left"
                value={`${Math.max(diningPreview.fatGoal - diningPreview.fats, 0)}g`}
                progress={diningPreview.fats / diningPreview.fatGoal}
                icon={MACRO_META.fats.icon}
                color={MACRO_META.fats.color}
              />
            </View>
          </View>

          <View style={[styles.page, { width: cardWidth }]}>
            <SurfaceCard floating style={styles.loggedMealsCard}>
              <View style={styles.loggedMealsHeader}>
                <AppText variant="title">Logged meals</AppText>
                <View style={styles.loggedMealsBadge}>
                  <AppText variant="label" color={AppColors.primary}>
                    {diningPreview.recentMeals.length} today
                  </AppText>
                </View>
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
                  icon={MACRO_META.protein.icon}
                  color={MACRO_META.protein.color}
                />
                <BreakdownRow
                  label="Carbs"
                  value={`${diningPreview.carbs}/${diningPreview.carbGoal}g`}
                  icon={MACRO_META.carbs.icon}
                  color={MACRO_META.carbs.color}
                />
                <BreakdownRow
                  label="Fats"
                  value={`${diningPreview.fats}/${diningPreview.fatGoal}g`}
                  icon={MACRO_META.fats.icon}
                  color={MACRO_META.fats.color}
                />
              </View>

              <ActionButton label="Edit Daily Goals" variant="ghost" />
            </SurfaceCard>
          </View>
        </ScrollView>

        <View style={styles.pageDots}>
          {[0, 1, 2].map((index) => (
            <View key={index} style={[styles.pageDot, activeSlide === index ? styles.pageDotActive : null]} />
          ))}
        </View>
      </View>

      <View style={styles.stack}>
        <SectionHeader title="Dining Halls" />
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
    <PressScale onPress={onPress}>
      <View style={[styles.periodChip, selected ? styles.periodChipSelected : styles.periodChipDefault]}>
        <AppText variant="label" color={selected ? AppColors.white : AppColors.textMuted}>
          {label}
        </AppText>
      </View>
    </PressScale>
  );
}

function MacroMiniCard({
  label,
  value,
  progress,
  icon,
  color,
}: {
  label: string;
  value: string;
  progress: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <SurfaceCard style={styles.macroMiniCard}>
      <View style={styles.macroMiniCopy}>
        <AppText variant="headline">{value}</AppText>
        <AppText variant="body" dimmed>
          {label}
        </AppText>
      </View>
      <IconRing progress={progress} color={color} icon={icon} size={72} strokeWidth={8} />
    </SurfaceCard>
  );
}

function BreakdownRow({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownLeft}>
        <Ionicons name={icon} size={14} color={color} />
        <AppText variant="body" dimmed>
          {label}
        </AppText>
      </View>
      <AppText variant="body">{value}</AppText>
    </View>
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

function HallRow({
  hall,
  selectedPeriod,
}: {
  hall: (typeof diningPreview.halls)[number];
  selectedPeriod: PeriodKey;
}) {
  const hours = hall.hours[selectedPeriod];
  const isOpen = Boolean(hours);

  return (
    <PressScale haptic="none">
      <SurfaceCard style={styles.hallCard}>
        <Image source={{ uri: hall.imageUrl }} style={styles.hallImage} contentFit="cover" transition={150} />
        <View style={styles.hallCopy}>
          <AppText variant="title">{hall.name}</AppText>
          <AppText dimmed>{hours ?? 'Closed'}</AppText>
        </View>
        <View style={styles.hallMeta}>
          <AppText variant="headline" color={isOpen ? AppColors.primary : AppColors.textSubtle}>
            {hall.fitPercent}%
          </AppText>
          <AppText variant="micro" dimmed>
            fit
          </AppText>
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
  calorieSideStat: {
    gap: Spacing.xs,
    width: 76,
  },
  calorieCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  macroRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  macroMiniCard: {
    flex: 1,
    gap: Spacing.md,
    minHeight: 138,
  },
  macroMiniCopy: {
    gap: Spacing.xs,
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
  loggedMealsBadge: {
    minHeight: 32,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md,
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
    gap: Spacing.lg,
  },
  breakdownTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  breakdownCopy: {
    gap: Spacing.xs,
    flex: 1,
  },
  breakdownRows: {
    gap: Spacing.md,
  },
  breakdownRow: {
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
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  periodChip: {
    flex: 1,
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
    gap: Spacing.md,
  },
  hallImage: {
    width: 68,
    height: 68,
    borderRadius: Radii.lg,
    backgroundColor: AppColors.surfaceLow,
  },
  hallCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  hallMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rowSpacing: {
    paddingBottom: Spacing.md,
  },
});
