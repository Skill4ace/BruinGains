import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';
import { ProgressRing } from '@/components/ui/progress-ring';
import { SectionHeader } from '@/components/ui/section-header';
import { SegmentedChip } from '@/components/ui/segmented-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { diningPreview } from '@/constants/preview-data';
import { AppColors, Radii, Spacing } from '@/constants/theme';

const HALL_ART = {
  epicuria: {
    icon: 'restaurant' as const,
    backgroundColor: '#1F4F73',
  },
  'bruin-plate': {
    icon: 'leaf' as const,
    backgroundColor: '#95D8B2',
  },
  'de-neve': {
    icon: 'fast-food' as const,
    backgroundColor: '#5A432E',
  },
};

export function DiningScreenPreview() {
  const [selectedHallId, setSelectedHallId] = useState<(typeof diningPreview.halls)[number]['id']>(
    diningPreview.halls[0].id
  );

  const selectedHall = useMemo(
    () => diningPreview.halls.find((hall) => hall.id === selectedHallId) ?? diningPreview.halls[0],
    [selectedHallId]
  );

  const progress = diningPreview.calories / diningPreview.calorieGoal;
  const caloriesLeft = Math.max(diningPreview.calorieGoal - diningPreview.calories, 0);

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="headline">Bruin Gains</AppText>
      </View>

      <SurfaceCard floating style={styles.calorieCard}>
        <View style={styles.calorieCopy}>
          <AppText variant="heroNumber">{diningPreview.calories}</AppText>
          <AppText variant="body">Calories</AppText>
        </View>
        <ProgressRing
          progress={progress}
          value={`${caloriesLeft}`}
          unit=""
          caption="left"
          size={96}
          strokeWidth={10}
          compact
          color={AppColors.text}
          trackColor="#ECECF4"
        />
      </SurfaceCard>

      <View style={styles.macroRow}>
        <MacroMiniCard
          label="Protein"
          value={`${diningPreview.protein}g`}
          icon="flame"
          color="#E76F6A"
        />
        <MacroMiniCard
          label="Carbs"
          value={`${diningPreview.carbs}g`}
          icon="leaf"
          color="#E2A061"
        />
        <MacroMiniCard
          label="Fat"
          value={`${diningPreview.fats}g`}
          icon="water"
          color="#5B8EE6"
        />
      </View>

      <View style={styles.stack}>
        <SectionHeader title="Dining Halls" actionLabel="Live Menus" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {diningPreview.halls.map((hall) => (
            <SegmentedChip
              key={hall.id}
              label={hall.name}
              selected={hall.id === selectedHall.id}
              onPress={() => setSelectedHallId(hall.id)}
            />
          ))}
        </ScrollView>
        <View style={styles.list}>
          {diningPreview.halls.map((hall) => (
            <HallRow key={hall.id} hall={hall} active={hall.id === selectedHall.id} />
          ))}
        </View>
      </View>

      <View style={styles.stack}>
        <SectionHeader title="Recent meals" actionLabel="Today" />
        <SurfaceCard style={styles.recentCard}>
          {diningPreview.recentMeals.map((meal, index) => (
            <View key={meal.id} style={[styles.recentRow, index < diningPreview.recentMeals.length - 1 ? styles.rowSpacing : null]}>
              <View style={styles.recentCopy}>
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
        </SurfaceCard>
      </View>
    </AppScreen>
  );
}

function MacroMiniCard({
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
    <SurfaceCard style={styles.macroMiniCard}>
      <View style={styles.macroMiniCopy}>
        <AppText variant="title">{value}</AppText>
        <AppText variant="micro" dimmed>
          {label}
        </AppText>
      </View>
      <View style={[styles.macroMiniIcon, { borderColor: color }]}>
        <Ionicons name={icon} size={12} color={color} />
      </View>
    </SurfaceCard>
  );
}

function HallRow({
  hall,
  active,
}: {
  hall: (typeof diningPreview.halls)[number];
  active: boolean;
}) {
  const art = HALL_ART[hall.id];

  return (
    <PressScale haptic="none">
      <SurfaceCard style={styles.hallCard}>
        <View style={[styles.hallArt, { backgroundColor: art.backgroundColor }]}>
          <Ionicons name={art.icon} size={24} color={AppColors.white} />
        </View>
        <View style={styles.hallCopy}>
          <AppText variant="title">{hall.name}</AppText>
          <AppText dimmed>{hall.subtitle}</AppText>
        </View>
        <View style={styles.hallMeta}>
          <AppText variant="headline" color={AppColors.primary}>
            {hall.avgCalories}
          </AppText>
          <AppText variant="micro" dimmed>
            avg kcal
          </AppText>
        </View>
        <View style={[styles.chevronWrap, active ? styles.chevronWrapActive : null]}>
          <Ionicons name="chevron-forward" size={16} color={active ? AppColors.primary : AppColors.textSubtle} />
        </View>
      </SurfaceCard>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.sm,
  },
  header: {
    paddingTop: Spacing.xs,
  },
  calorieCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.lg,
  },
  calorieCopy: {
    gap: Spacing.xs,
    flex: 1,
  },
  macroRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  macroMiniCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    minHeight: 88,
  },
  macroMiniCopy: {
    gap: Spacing.xs,
    flexShrink: 1,
  },
  macroMiniIcon: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: {
    gap: Spacing.md,
  },
  chipRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  list: {
    gap: Spacing.md,
  },
  hallCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  hallArt: {
    width: 58,
    height: 58,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hallCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  hallMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronWrapActive: {
    backgroundColor: 'rgba(39,116,174,0.12)',
  },
  recentCard: {
    gap: Spacing.md,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  recentCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  rowSpacing: {
    paddingBottom: Spacing.md,
  },
});
