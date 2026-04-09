import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/ui/action-button';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';
import { SurfaceCard } from '@/components/ui/surface-card';
import { gymPreview } from '@/constants/preview-data';
import { AppColors, Radii, Spacing } from '@/constants/theme';

export function WorkoutSessionPreview() {
  const router = useRouter();

  return (
    <AppScreen tabbed={false} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <PressScale onPress={() => router.back()} haptic="none">
          <View style={styles.headerButton}>
            <Ionicons name="chevron-back" size={18} color={AppColors.text} />
          </View>
        </PressScale>
        <View style={styles.headerCopy}>
          <AppText variant="eyebrow" color={AppColors.textMuted}>
            Active workout
          </AppText>
          <AppText variant="title">Leg Day</AppText>
        </View>
        <View style={styles.timerBadge}>
          <AppText variant="label" color={AppColors.primary}>
            38:12
          </AppText>
        </View>
      </View>

      {gymPreview.exercises.map((exercise, index) => (
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
            <View style={styles.iconRow}>
              <View style={styles.headerButton}>
                <Ionicons name="timer-outline" size={15} color={AppColors.textSubtle} />
              </View>
              <View style={[styles.headerButton, exercise.active ? styles.headerButtonAccent : null]}>
                <Ionicons name="add" size={15} color={exercise.active ? AppColors.primary : AppColors.textSubtle} />
              </View>
            </View>
          </View>
          {exercise.active ? (
            <>
              <View style={styles.metricGrid}>
                <SetMetric label="Prev" value={exercise.previous} />
                <SetMetric label="Lbs" value={exercise.current} highlight />
                <SetMetric label="Reps" value={exercise.reps} />
              </View>
              <ActionButton label="Log Set" compact />
            </>
          ) : null}
        </SurfaceCard>
      ))}

      <SurfaceCard tone="low" style={styles.bottomCard}>
        <View style={styles.bottomRow}>
          <View>
            <AppText variant="micro" dimmed>
              Rest timer
            </AppText>
            <AppText variant="title">01:30 ready</AppText>
          </View>
          <ActionButton label="Finish Workout" variant="secondary" compact />
        </View>
      </SurfaceCard>
    </AppScreen>
  );
}

function SetMetric({
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
    gap: Spacing.md,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonAccent: {
    backgroundColor: AppColors.secondaryContainer,
  },
  headerCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  timerBadge: {
    minHeight: 38,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md,
    backgroundColor: AppColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
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
  iconRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
  bottomCard: {
    marginTop: Spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
});
