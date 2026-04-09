import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  formatWorkoutTimerLabel,
  getActiveWorkoutSessionView,
} from '@/data/local/selectors';
import { useAppData } from '@/providers/app-data-provider';
import { ActionButton } from '@/components/ui/action-button';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';
import { SurfaceCard } from '@/components/ui/surface-card';
import { AppColors, Radii, Spacing } from '@/constants/theme';

export function WorkoutSessionPreview() {
  const router = useRouter();
  const { finishWorkoutSession, logSet, state } = useAppData();
  const activeWorkout = getActiveWorkoutSessionView(state);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

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
          <AppText variant="title">{activeWorkout?.session.title ?? 'Workout'}</AppText>
        </View>
        <View style={styles.timerBadge}>
          <AppText variant="label" color={AppColors.primary}>
            {activeWorkout
              ? formatWorkoutTimerLabel(activeWorkout.session.startedAt, clock)
              : '00:00'}
          </AppText>
        </View>
      </View>

      {!activeWorkout ? (
        <SurfaceCard tone="low" style={styles.emptyCard}>
          <AppText variant="title">No active session</AppText>
          <AppText variant="body" dimmed>
            Start a template or an empty workout from the Gym tab. Your local session history
            is already being saved on device.
          </AppText>
          <ActionButton label="Back to Gym" variant="ghost" onPress={() => router.back()} />
        </SurfaceCard>
      ) : activeWorkout.exercises.length === 0 ? (
        <SurfaceCard tone="low" style={styles.emptyCard}>
          <AppText variant="title">Open session saved</AppText>
          <AppText variant="body" dimmed>
            This blank workout is persisted locally. Template-backed exercise editing lands in a
            later module, but the session itself is already recoverable offline.
          </AppText>
          <ActionButton
            label="Finish Workout"
            variant="secondary"
            onPress={() => {
              finishWorkoutSession(activeWorkout.session.id);
              router.back();
            }}
          />
        </SurfaceCard>
      ) : (
        activeWorkout.exercises.map((exercise) => (
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
                {exercise.completedSets}/{exercise.targetSets} sets • {exercise.repRange}
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
                <SetMetric label="Prev" value={exercise.previousLoadLabel} />
                <SetMetric label="Lbs" value={String(exercise.currentLoad)} highlight />
                <SetMetric label="Reps" value={String(exercise.targetReps)} />
              </View>
              <ActionButton label="Log Set" compact onPress={() => logSet(exercise.id)} />
            </>
          ) : null}
        </SurfaceCard>
      )))}

      {activeWorkout ? (
        <SurfaceCard tone="low" style={styles.bottomCard}>
          <View style={styles.bottomRow}>
            <View>
              <AppText variant="micro" dimmed>
                Rest timer
              </AppText>
              <AppText variant="title">01:30 ready</AppText>
            </View>
            <ActionButton
              label="Finish Workout"
              variant="secondary"
              compact
              onPress={() => {
                finishWorkoutSession(activeWorkout.session.id);
                router.back();
              }}
            />
          </View>
        </SurfaceCard>
      ) : null}
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
  emptyCard: {
    gap: Spacing.md,
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
