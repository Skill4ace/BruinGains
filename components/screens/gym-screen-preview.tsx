import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/ui/action-button';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { CapacityMeter } from '@/components/ui/capacity-meter';
import { SectionHeader } from '@/components/ui/section-header';
import { SegmentedChip } from '@/components/ui/segmented-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { gymPreview } from '@/constants/preview-data';
import { AppColors, Radii, Spacing } from '@/constants/theme';

export function GymScreenPreview() {
  const router = useRouter();

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText variant="eyebrow" color={AppColors.textMuted}>
            Gym
          </AppText>
          <AppText variant="headline">Crowding + training</AppText>
        </View>
        <View style={styles.headerAction}>
          <Ionicons name="barbell" size={16} color={AppColors.primary} />
        </View>
      </View>

      <SurfaceCard floating style={styles.capacityCard}>
        <SectionHeader title="Gym Capacity" />
        <View style={styles.capacityStack}>
          {gymPreview.capacities.map((location) => (
            <CapacityMeter
              key={location.id}
              name={location.name}
              status={location.status}
              percent={location.percent}
              load={location.load}
              tone={location.tone}
            />
          ))}
        </View>
        <ActionButton label="View Live Schedules" variant="ghost" compact />
      </SurfaceCard>

      <SurfaceCard style={styles.prCard}>
        <View style={styles.prIcon}>
          <Ionicons name="trophy" size={16} color={AppColors.white} />
        </View>
        <View style={styles.prCopy}>
          <AppText variant="micro" dimmed>
            Latest PR
          </AppText>
          <AppText variant="title">Bench Press: 225 lbs</AppText>
        </View>
        <Ionicons name="chevron-forward" size={16} color={AppColors.textSubtle} />
      </SurfaceCard>

      <View style={styles.stack}>
        <SectionHeader title="Activity Streak" />
        <SurfaceCard tone="low" style={styles.streakCard}>
          <View style={styles.weekRow}>
            {gymPreview.weekStrip.map((day) => {
              const isActive = 'active' in day && day.active;
              const isHighlighted = 'highlighted' in day && day.highlighted;

              return (
                <View key={day.id} style={styles.weekItem}>
                  <AppText variant="micro" dimmed>
                    {day.label}
                  </AppText>
                  <View
                    style={[
                      styles.weekDot,
                      isActive ? styles.weekDotActive : null,
                      isHighlighted ? styles.weekDotHighlight : null,
                      !isActive && !isHighlighted ? styles.weekDotFuture : null,
                    ]}
                  >
                    {isActive ? <Ionicons name="checkmark" size={12} color={AppColors.white} /> : null}
                    {isHighlighted ? <Ionicons name="flash" size={12} color="#5C4B00" /> : null}
                  </View>
                </View>
              );
            })}
          </View>
        </SurfaceCard>
      </View>

      <View style={styles.stack}>
        <ActionButton label="Start Workout" onPress={() => router.push('/workout/session')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {gymPreview.templates.map((template) => (
            <SegmentedChip key={template} label={template} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.stack}>
        <SectionHeader title="Current logging" />
        {gymPreview.exercises.map((exercise) => (
          <SurfaceCard key={exercise.id} style={[styles.exerciseCard, exercise.active ? styles.exerciseCardActive : null]}>
            <View style={styles.exerciseTop}>
              <View style={[styles.exerciseIcon, exercise.active ? styles.exerciseIconActive : null]}>
                <Ionicons
                  name={exercise.active ? 'play' : 'barbell-outline'}
                  size={14}
                  color={exercise.active ? AppColors.white : AppColors.primary}
                />
              </View>
              <View style={styles.exerciseCopy}>
                <AppText variant="bodyStrong">{exercise.name}</AppText>
                <AppText variant="label" dimmed>
                  {exercise.sets} • {exercise.repRange}
                </AppText>
              </View>
              <Ionicons name="ellipsis-vertical" size={16} color={AppColors.textSubtle} />
            </View>
            {exercise.active ? (
              <>
                <View style={styles.metricGrid}>
                  <Metric label="Prev" value={exercise.previous} />
                  <Metric label="Lbs" value={exercise.current} highlight />
                  <Metric label="Reps" value={exercise.reps} />
                </View>
                <ActionButton label="Log Set" compact />
              </>
            ) : null}
          </SurfaceCard>
        ))}
      </View>
    </AppScreen>
  );
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.metricCell}>
      <AppText variant="micro" dimmed>
        {label}
      </AppText>
      <AppText variant="title" color={highlight ? AppColors.primary : AppColors.text}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  headerCopy: {
    gap: Spacing.xs,
  },
  headerAction: {
    width: 34,
    height: 34,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: {
    gap: Spacing.md,
  },
  capacityCard: {
    gap: Spacing.lg,
  },
  capacityStack: {
    gap: Spacing.lg,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  prIcon: {
    width: 42,
    height: 42,
    borderRadius: Radii.pill,
    backgroundColor: '#A66F00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  streakCard: {
    gap: Spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  weekItem: {
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  weekDot: {
    width: 30,
    height: 30,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceHighest,
  },
  weekDotActive: {
    backgroundColor: AppColors.primaryContainer,
  },
  weekDotHighlight: {
    backgroundColor: AppColors.secondary,
  },
  weekDotFuture: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: AppColors.textSubtle,
  },
  chipRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  exerciseCard: {
    gap: Spacing.md,
  },
  exerciseCardActive: {
    borderWidth: 2,
    borderColor: AppColors.primaryContainer,
  },
  exerciseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  exerciseIcon: {
    width: 40,
    height: 40,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIconActive: {
    backgroundColor: AppColors.primaryContainer,
  },
  exerciseCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metricCell: {
    flex: 1,
    gap: Spacing.xs,
    paddingBottom: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: AppColors.surfaceHighest,
  },
});
