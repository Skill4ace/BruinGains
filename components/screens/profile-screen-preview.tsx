import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { formatMealLogMeta } from '@/data/local/selectors';
import {
  ACTIVITY_LEVEL_OPTIONS,
  NUTRITION_GOAL_OPTIONS,
  SEX_OPTIONS,
  WORKOUT_SPLIT_OPTIONS,
  calculateGoalTargets,
  getWorkoutsPerWeekForSplit,
} from '@/lib/goal-calculator';
import { formatDurationMinutes } from '@/lib/workout-duration';
import { useAppData } from '@/providers/app-data-provider';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';
import { SurfaceCard } from '@/components/ui/surface-card';
import { AppColors, Radii, Spacing } from '@/constants/theme';
import type {
  LocalAppData,
  MealLog,
  ProfileActivityLevel,
  ProfileNutritionGoal,
  ProfileSex,
  UpdateGoalPlanInput,
  WorkoutSessionExercise,
  WorkoutSet,
  WorkoutTrackingMode,
  WorkoutSplitPreset,
} from '@/types/app-data';

const DAY_MS = 24 * 60 * 60 * 1000;
const CALENDAR_WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

type DayActivityTone = 'both' | 'empty' | 'nutrition' | 'workout';

type WorkoutSetDetail = {
  displayValue: string;
  id: string;
  setLabel: string;
};

type WorkoutExerciseDetail = {
  id: string;
  name: string;
  sets: WorkoutSetDetail[];
};

type WorkoutSessionDetail = {
  durationLabel: string;
  exerciseCount: number;
  exercises: WorkoutExerciseDetail[];
  id: string;
  timeLabel: string;
  title: string;
};

type DayHistory = {
  calories: number;
  date: Date;
  hasLogs: boolean;
  hasNutrition: boolean;
  hasWorkout: boolean;
  id: string;
  isFuture: boolean;
  mealCount: number;
  meals: MealLog[];
  subtitle: string;
  title: string;
  workoutCount: number;
  workouts: WorkoutSessionDetail[];
};

type WeekHistory = {
  averageCalories: number;
  days: DayHistory[];
  id: string;
  label: string;
  loggedDayCount: number;
  startDate: Date;
  workoutCount: number;
};

type DayActivitySummary = {
  tone: DayActivityTone;
};

type CalendarDayCell = {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isFuture: boolean;
  isSelected: boolean;
  tone: DayActivityTone;
};

type GoalPlanDraft = {
  activityLevel: ProfileActivityLevel;
  age: string;
  calories: string;
  carbs: string;
  fats: string;
  heightInches: string;
  nutritionGoal: ProfileNutritionGoal;
  protein: string;
  sex: ProfileSex;
  weightPounds: string;
  workoutSplitPreset: WorkoutSplitPreset;
  workoutsPerWeek: number;
};

function startOfLocalDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfWeek(date: Date) {
  const next = startOfLocalDay(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function startOfMonth(date: Date) {
  const next = startOfLocalDay(date);
  next.setDate(1);
  return next;
}

function endOfMonth(date: Date) {
  const next = startOfMonth(date);
  next.setMonth(next.getMonth() + 1);
  next.setDate(0);
  return startOfLocalDay(next);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getTime() + amount * DAY_MS);
}

function addMonths(date: Date, amount: number) {
  const next = startOfMonth(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function getDateKey(date: Date) {
  return startOfLocalDay(date).toISOString().slice(0, 10);
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map((value) => Number.parseInt(value, 10));
  return new Date(year, month - 1, day);
}

function formatWeekLabel(startDate: Date) {
  const endDate = addDays(startDate, 6);
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatDayTitle(date: Date, referenceDate: Date) {
  const dayDiff =
    (startOfLocalDay(referenceDate).getTime() - startOfLocalDay(date).getTime()) / DAY_MS;

  if (dayDiff === 0) {
    return 'Today';
  }

  if (dayDiff === 1) {
    return 'Yesterday';
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
  }).format(date);
}

function formatDaySubtitle(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatTimeLabel(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatWorkoutDuration(startedAt: string, endedAt: string | null) {
  if (!endedAt) {
    return 'Live';
  }

  const minutes = Math.max(
    1,
    Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / (60 * 1000)),
  );

  return `${minutes}m`;
}

function formatCaloriesCompact(calories: number) {
  return calories.toLocaleString();
}

function getActivityTone(hasNutrition: boolean, hasWorkout: boolean): DayActivityTone {
  if (hasNutrition && hasWorkout) {
    return 'both';
  }

  if (hasNutrition) {
    return 'nutrition';
  }

  if (hasWorkout) {
    return 'workout';
  }

  return 'empty';
}

function getVisibleDaysForWeek(week: WeekHistory | null) {
  if (!week) {
    return [];
  }

  return [...week.days]
    .filter((day) => !day.isFuture)
    .sort((left, right) => right.date.getTime() - left.date.getTime());
}

function getPreferredExpandedDayId(
  week: WeekHistory | null,
  fallbackDayId: string | null,
) {
  const visibleDays = getVisibleDaysForWeek(week);

  if (fallbackDayId && visibleDays.some((day) => day.id === fallbackDayId)) {
    return fallbackDayId;
  }

  return visibleDays.find((day) => day.hasLogs)?.id ?? visibleDays[0]?.id ?? null;
}

function buildMonthCalendar(
  monthStart: Date,
  activityByDay: Map<string, DayActivitySummary>,
  selectedDayId: string | null,
  referenceDate: Date,
) {
  const gridStart = startOfWeek(monthStart);
  const gridEnd = addDays(startOfWeek(endOfMonth(monthStart)), 6);
  const weeks: CalendarDayCell[][] = [];

  for (
    let cursor = gridStart;
    cursor.getTime() <= gridEnd.getTime();
    cursor = addDays(cursor, 7)
  ) {
    const week = Array.from({ length: 7 }, (_, dayIndex) => {
      const date = addDays(cursor, dayIndex);
      const dateKey = getDateKey(date);
      const activity = activityByDay.get(dateKey);

      return {
        dateKey,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === monthStart.getMonth(),
        isFuture: startOfLocalDay(date).getTime() > startOfLocalDay(referenceDate).getTime(),
        isSelected: selectedDayId === dateKey,
        tone: activity?.tone ?? 'empty',
      } satisfies CalendarDayCell;
    });

    weeks.push(week);
  }

  return weeks;
}

function createGoalPlanDraft(state: LocalAppData): GoalPlanDraft {
  return {
    activityLevel: state.profile.activityLevel,
    age: String(state.profile.age),
    calories: String(state.goals.calories),
    carbs: String(state.goals.carbs),
    fats: String(state.goals.fats),
    heightInches: String(state.profile.heightInches),
    nutritionGoal: state.profile.nutritionGoal,
    protein: String(state.goals.protein),
    sex: state.profile.sex,
    weightPounds: String(state.profile.weightPounds),
    workoutSplitPreset: state.profile.workoutSplitPreset,
    workoutsPerWeek: state.goals.workoutsPerWeek,
  };
}

function parsePositiveInteger(value: string, minimum: number) {
  const parsed = Number.parseInt(value.trim(), 10);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(minimum, Math.round(parsed));
}

function parsePositiveNumber(value: string, minimum: number) {
  const parsed = Number.parseFloat(value.trim());

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(minimum, parsed);
}

function buildGoalPlanInput(draft: GoalPlanDraft): UpdateGoalPlanInput | null {
  const age = parsePositiveInteger(draft.age, 13);
  const heightInches = parsePositiveInteger(draft.heightInches, 48);
  const weightPounds = parsePositiveNumber(draft.weightPounds, 80);
  const calories = parsePositiveInteger(draft.calories, 1200);
  const protein = parsePositiveInteger(draft.protein, 60);
  const carbs = parsePositiveInteger(draft.carbs, 50);
  const fats = parsePositiveInteger(draft.fats, 20);

  if (
    age === null ||
    heightInches === null ||
    weightPounds === null ||
    calories === null ||
    protein === null ||
    carbs === null ||
    fats === null
  ) {
    return null;
  }

  return {
    activityLevel: draft.activityLevel,
    age,
    calories,
    carbs,
    fats,
    heightInches,
    nutritionGoal: draft.nutritionGoal,
    protein,
    sex: draft.sex,
    weightPounds,
    workoutSplitPreset: draft.workoutSplitPreset,
    workoutsPerWeek: Math.max(1, Math.min(7, draft.workoutsPerWeek)),
  };
}

function formatWorkoutSetLabel(set: WorkoutSet) {
  const setType = set.setType ?? 'normal';

  if (setType === 'warmup') {
    return `Set ${set.setNumber ?? 1} • W`;
  }

  if (setType === 'drop') {
    return `Set ${set.setNumber ?? 1} • D`;
  }

  if (setType === 'failure') {
    return `Set ${set.setNumber ?? 1} • F`;
  }

  return `Set ${set.setNumber ?? 1}`;
}

function formatWorkoutSetValue(set: WorkoutSet, trackingMode: WorkoutTrackingMode) {
  if (trackingMode === 'duration') {
    return formatDurationMinutes(set.durationMinutes ?? 0);
  }

  return `${set.load} lb × ${set.reps}`;
}

function buildWorkoutExercises(
  sessionExercises: WorkoutSessionExercise[],
  setsBySessionExerciseId: Map<string, WorkoutSet[]>,
) {
  return [...sessionExercises]
    .sort((left, right) => left.order - right.order)
    .map((exercise) => {
      const completedSets = (setsBySessionExerciseId.get(exercise.id) ?? [])
        .filter((set) => set.completed ?? true)
        .sort((left, right) => {
          const leftSetNumber = left.setNumber ?? Number.MAX_SAFE_INTEGER;
          const rightSetNumber = right.setNumber ?? Number.MAX_SAFE_INTEGER;

          if (leftSetNumber !== rightSetNumber) {
            return leftSetNumber - rightSetNumber;
          }

          return left.loggedAt.localeCompare(right.loggedAt);
        });

      return {
        id: exercise.id,
        name: exercise.name,
        sets: completedSets.map((set) => ({
          displayValue: formatWorkoutSetValue(set, exercise.trackingMode ?? 'strength'),
          id: set.id,
          setLabel: formatWorkoutSetLabel(set),
        })),
      } satisfies WorkoutExerciseDetail;
    });
}

function buildProfileHistory(state: LocalAppData, referenceDate = new Date()) {
  const mealsByDay = new Map<string, MealLog[]>();

  state.mealLogs.forEach((meal) => {
    const dateKey = getDateKey(new Date(meal.loggedAt));
    const existingMeals = mealsByDay.get(dateKey) ?? [];
    existingMeals.push(meal);
    mealsByDay.set(dateKey, existingMeals);
  });

  mealsByDay.forEach((meals, key) => {
    mealsByDay.set(
      key,
      [...meals].sort((left, right) => right.loggedAt.localeCompare(left.loggedAt)),
    );
  });

  const sessionExercisesBySessionId = new Map<string, WorkoutSessionExercise[]>();

  state.workoutSessionExercises.forEach((exercise) => {
    const existingExercises = sessionExercisesBySessionId.get(exercise.sessionId) ?? [];
    existingExercises.push(exercise);
    sessionExercisesBySessionId.set(exercise.sessionId, existingExercises);
  });

  const setsBySessionExerciseId = new Map<string, WorkoutSet[]>();

  state.workoutSets.forEach((set) => {
    const existingSets = setsBySessionExerciseId.get(set.sessionExerciseId) ?? [];
    existingSets.push(set);
    setsBySessionExerciseId.set(set.sessionExerciseId, existingSets);
  });

  const workoutsByDay = new Map<string, WorkoutSessionDetail[]>();
  const completedSessions = state.workoutSessions.filter((session) => Boolean(session.endedAt));

  completedSessions.forEach((session) => {
    const dateKey = getDateKey(new Date(session.startedAt));
    const exercises = buildWorkoutExercises(
      sessionExercisesBySessionId.get(session.id) ?? [],
      setsBySessionExerciseId,
    );
    const existingWorkouts = workoutsByDay.get(dateKey) ?? [];

    existingWorkouts.push({
      durationLabel: formatWorkoutDuration(session.startedAt, session.endedAt),
      exerciseCount: exercises.length,
      exercises,
      id: session.id,
      timeLabel: formatTimeLabel(session.startedAt),
      title: session.title,
    });

    workoutsByDay.set(dateKey, existingWorkouts);
  });

  workoutsByDay.forEach((workouts, key) => {
    workoutsByDay.set(
      key,
      [...workouts].sort((left, right) => right.timeLabel.localeCompare(left.timeLabel)),
    );
  });

  const activityByDay = new Map<string, DayActivitySummary>();
  const activityKeys = new Set<string>([...mealsByDay.keys(), ...workoutsByDay.keys()]);

  activityKeys.forEach((dateKey) => {
    const hasNutrition = (mealsByDay.get(dateKey) ?? []).length > 0;
    const hasWorkout = (workoutsByDay.get(dateKey) ?? []).length > 0;

    activityByDay.set(dateKey, {
      tone: getActivityTone(hasNutrition, hasWorkout),
    });
  });

  const activityTimestamps = [
    ...state.mealLogs.map((meal) => new Date(meal.loggedAt).getTime()),
    ...completedSessions.map((session) => new Date(session.startedAt).getTime()),
  ];
  const earliestActivityDate =
    activityTimestamps.length > 0 ? new Date(Math.min(...activityTimestamps)) : referenceDate;
  const currentWeekStart = startOfWeek(referenceDate);
  const earliestWeekStart = startOfWeek(earliestActivityDate);
  const weekHistories: WeekHistory[] = [];

  for (
    let cursor = currentWeekStart;
    cursor.getTime() >= earliestWeekStart.getTime();
    cursor = addDays(cursor, -7)
  ) {
    const days = Array.from({ length: 7 }, (_, dayIndex) => {
      const date = addDays(cursor, dayIndex);
      const dateKey = getDateKey(date);
      const meals = mealsByDay.get(dateKey) ?? [];
      const workouts = workoutsByDay.get(dateKey) ?? [];
      const calories = meals.reduce((total, meal) => total + meal.calories, 0);
      const isFuture =
        startOfLocalDay(date).getTime() > startOfLocalDay(referenceDate).getTime();

      return {
        calories,
        date,
        hasLogs: meals.length > 0 || workouts.length > 0,
        hasNutrition: meals.length > 0,
        hasWorkout: workouts.length > 0,
        id: dateKey,
        isFuture,
        mealCount: meals.length,
        meals,
        subtitle: formatDaySubtitle(date),
        title: formatDayTitle(date, referenceDate),
        workoutCount: workouts.length,
        workouts,
      } satisfies DayHistory;
    });

    const nutritionDays = days.filter((day) => day.hasNutrition);
    const weekHistory = {
      averageCalories:
        nutritionDays.length > 0
          ? Math.round(
              nutritionDays.reduce((total, day) => total + day.calories, 0) / nutritionDays.length,
            )
          : 0,
      days,
      id: cursor.toISOString(),
      label: formatWeekLabel(cursor),
      loggedDayCount: days.filter((day) => day.hasLogs).length,
      startDate: cursor,
      workoutCount: days.reduce((total, day) => total + day.workoutCount, 0),
    } satisfies WeekHistory;

    if (weekHistory.loggedDayCount > 0 || getDateKey(cursor) === getDateKey(currentWeekStart)) {
      weekHistories.push(weekHistory);
    }
  }

  return {
    activityByDay,
    earliestActivityDate,
    weekHistories,
  };
}

export function ProfileScreenPreview() {
  const { state, updateGoalPlan } = useAppData();
  const referenceDate = useMemo(() => new Date(), []);
  const todayDayId = getDateKey(referenceDate);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [expandedDayId, setExpandedDayId] = useState<string | null>(todayDayId);
  const [expandedSectionKeys, setExpandedSectionKeys] = useState<string[]>([]);
  const [consistencyOpen, setConsistencyOpen] = useState(false);
  const [goalSettingsOpen, setGoalSettingsOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState<GoalPlanDraft>(() => createGoalPlanDraft(state));
  const [calendarMonthStart, setCalendarMonthStart] = useState(startOfMonth(referenceDate));
  const { activityByDay, earliestActivityDate, weekHistories } = useMemo(
    () => buildProfileHistory(state, referenceDate),
    [referenceDate, state],
  );
  const clampedWeekIndex = Math.min(selectedWeekIndex, Math.max(weekHistories.length - 1, 0));
  const selectedWeek = weekHistories[clampedWeekIndex] ?? null;
  const visibleDays = useMemo(() => getVisibleDaysForWeek(selectedWeek), [selectedWeek]);
  const earliestMonthStart = startOfMonth(earliestActivityDate);
  const currentMonthStart = startOfMonth(referenceDate);
  const calendarWeeks = useMemo(
    () => buildMonthCalendar(calendarMonthStart, activityByDay, expandedDayId, referenceDate),
    [activityByDay, calendarMonthStart, expandedDayId, referenceDate],
  );

  const selectWeekByIndex = (index: number) => {
    const boundedIndex = Math.max(0, Math.min(index, weekHistories.length - 1));
    const nextWeek = weekHistories[boundedIndex] ?? null;

    setSelectedWeekIndex(boundedIndex);
    setExpandedDayId((currentDayId) => getPreferredExpandedDayId(nextWeek, currentDayId));
    setExpandedSectionKeys([]);
  };

  const handleToggleDay = (dayId: string) => {
    setExpandedSectionKeys([]);
    setExpandedDayId((currentValue) => (currentValue === dayId ? null : dayId));
  };

  const toggleSection = (dayId: string, section: 'meals' | 'workouts') => {
    const sectionKey = `${dayId}:${section}`;

    setExpandedSectionKeys((currentValue) =>
      currentValue.includes(sectionKey)
        ? currentValue.filter((currentKey) => currentKey !== sectionKey)
        : [...currentValue, sectionKey],
    );
  };

  const handleOpenCalendar = () => {
    setCalendarMonthStart(startOfMonth(parseDateKey(expandedDayId ?? todayDayId)));
    setConsistencyOpen(true);
  };

  const handleSelectCalendarDay = (dayId: string) => {
    const nextWeekIndex = weekHistories.findIndex((weekHistory) =>
      weekHistory.days.some((day) => day.id === dayId),
    );

    if (nextWeekIndex === -1) {
      return;
    }

    setSelectedWeekIndex(nextWeekIndex);
    setExpandedDayId(dayId);
    setExpandedSectionKeys([]);
    setConsistencyOpen(false);
  };

  const canGoToOlderWeek = clampedWeekIndex < weekHistories.length - 1;
  const canGoToNewerWeek = clampedWeekIndex > 0;
  const canGoToPreviousMonth = calendarMonthStart.getTime() > earliestMonthStart.getTime();
  const canGoToNextMonth = calendarMonthStart.getTime() < currentMonthStart.getTime();

  const handleOpenGoalSettings = () => {
    setGoalDraft(createGoalPlanDraft(state));
    setGoalSettingsOpen(true);
  };

  const handleGoalDraftChange = <K extends keyof GoalPlanDraft>(
    key: K,
    value: GoalPlanDraft[K],
  ) => {
    setGoalDraft((currentValue) => ({
      ...currentValue,
      [key]: value,
    }));
  };

  const handleSplitSelect = (split: WorkoutSplitPreset) => {
    const workoutsPerWeek = getWorkoutsPerWeekForSplit(split);

    setGoalDraft((currentValue) => ({
      ...currentValue,
      workoutSplitPreset: split,
      workoutsPerWeek: workoutsPerWeek ?? currentValue.workoutsPerWeek,
    }));
  };

  const handleRecalculateGoals = () => {
    const age = parsePositiveInteger(goalDraft.age, 13);
    const heightInches = parsePositiveInteger(goalDraft.heightInches, 48);
    const weightPounds = parsePositiveNumber(goalDraft.weightPounds, 80);

    if (age === null || heightInches === null || weightPounds === null) {
      Alert.alert('Enter your info first', 'Height, weight, and age are required to recalculate.');
      return;
    }

    const calculatedGoals = calculateGoalTargets({
      activityLevel: goalDraft.activityLevel,
      age,
      heightInches,
      nutritionGoal: goalDraft.nutritionGoal,
      sex: goalDraft.sex,
      weightPounds,
    });

    setGoalDraft((currentValue) => ({
      ...currentValue,
      calories: String(calculatedGoals.calories),
      carbs: String(calculatedGoals.carbs),
      fats: String(calculatedGoals.fats),
      protein: String(calculatedGoals.protein),
    }));
  };

  const handleSaveGoals = () => {
    const nextGoalPlan = buildGoalPlanInput(goalDraft);

    if (!nextGoalPlan) {
      Alert.alert(
        'Check your values',
        'Enter valid calories, macros, height, weight, and age before saving.',
      );
      return;
    }

    updateGoalPlan(nextGoalPlan);
    setGoalSettingsOpen(false);
  };

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="headline">Profile</AppText>
      </View>

      <View style={styles.stack}>
        <PressScale haptic="light" onPress={handleOpenGoalSettings}>
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
        <SurfaceCard floating style={styles.logsCard}>
          <View style={styles.logsHeader}>
            <AppText variant="title">Logs</AppText>
            <PressScale haptic="light" onPress={handleOpenCalendar}>
              <View style={styles.calendarButton}>
                <Ionicons name="calendar-outline" size={18} color={AppColors.primary} />
              </View>
            </PressScale>
          </View>

          <View style={styles.weekPager}>
            <PressScale
              haptic="light"
              disabled={!canGoToOlderWeek}
              onPress={() => selectWeekByIndex(clampedWeekIndex + 1)}>
              <View
                style={[
                  styles.weekPagerButton,
                  !canGoToOlderWeek ? styles.weekPagerButtonDisabled : null,
                ]}>
                <Ionicons name="chevron-back" size={16} color={AppColors.text} />
              </View>
            </PressScale>

            <View style={styles.weekPagerCopy}>
              <AppText variant="bodyStrong">
                {clampedWeekIndex === 0 ? 'This week' : selectedWeek?.label ?? 'Logs'}
              </AppText>
            </View>

            <PressScale
              haptic="light"
              disabled={!canGoToNewerWeek}
              onPress={() => selectWeekByIndex(clampedWeekIndex - 1)}>
              <View
                style={[
                  styles.weekPagerButton,
                  !canGoToNewerWeek ? styles.weekPagerButtonDisabled : null,
                ]}>
                <Ionicons name="chevron-forward" size={16} color={AppColors.text} />
              </View>
            </PressScale>
          </View>

          {selectedWeek ? (
            <>
              <View style={styles.weekSummaryRow}>
                <SummaryTile label="Avg calories" value={formatCaloriesCompact(selectedWeek.averageCalories)} />
                <SummaryTile label="Workouts" value={String(selectedWeek.workoutCount)} />
              </View>

              <View style={styles.dayList}>
                {visibleDays.map((day) => {
                  const isExpanded = expandedDayId === day.id;
                  const mealsOpen = expandedSectionKeys.includes(`${day.id}:meals`);
                  const workoutsOpen = expandedSectionKeys.includes(`${day.id}:workouts`);

                  return (
                    <View key={day.id} style={styles.dayBlock}>
                      <PressScale
                        haptic="light"
                        onPress={() => handleToggleDay(day.id)}
                        pressEffect="opacity">
                        <View style={[styles.dayRow, isExpanded ? styles.dayRowExpanded : null]}>
                          <View style={styles.dayRowCopy}>
                            <AppText variant="bodyStrong">{day.title}</AppText>
                            <AppText variant="micro" dimmed>
                              {day.subtitle}
                            </AppText>
                          </View>

                          <View style={styles.dayRowRight}>
                            {day.mealCount > 0 ? (
                              <ActivityCountPill
                                color="#9A6700"
                                icon="restaurant-outline"
                                tone="nutrition"
                                value={String(day.mealCount)}
                              />
                            ) : null}
                            {day.workoutCount > 0 ? (
                              <ActivityCountPill
                                color={AppColors.primary}
                                icon="barbell-outline"
                                tone="workout"
                                value={String(day.workoutCount)}
                              />
                            ) : null}
                            <Ionicons
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={16}
                              color={AppColors.textSubtle}
                            />
                          </View>
                        </View>
                      </PressScale>

                      {isExpanded ? (
                        <View style={styles.dayExpanded}>
                          <View style={styles.sectionBlock}>
                            <PressScale
                              haptic="light"
                              disabled={day.mealCount === 0}
                              onPress={() => toggleSection(day.id, 'meals')}
                              pressEffect="opacity">
                              <View
                                style={[
                                  styles.sectionSummaryRow,
                                  day.mealCount === 0 ? styles.sectionSummaryDisabled : null,
                                ]}>
                                <View style={styles.sectionSummaryLeading}>
                                  <View
                                    style={[
                                      styles.sectionIconWrap,
                                      styles.sectionIconWrapNutrition,
                                    ]}>
                                    <Ionicons
                                      name="restaurant-outline"
                                      size={13}
                                      color="#9A6700"
                                    />
                                  </View>
                                  <View style={styles.sectionSummaryCopy}>
                                    <AppText variant="bodyStrong">Meals</AppText>
                                    <AppText variant="micro" dimmed>
                                      {day.mealCount > 0
                                        ? `${day.mealCount} logged • ${day.calories.toLocaleString()} kcal`
                                        : 'No meals logged'}
                                    </AppText>
                                  </View>
                                </View>
                                <Ionicons
                                  name={mealsOpen ? 'chevron-up' : 'chevron-down'}
                                  size={16}
                                  color={AppColors.textSubtle}
                                />
                              </View>
                            </PressScale>

                            {mealsOpen ? (
                              <View style={styles.sectionDetailPanel}>
                                {day.meals.map((meal, mealIndex) => (
                                  <View
                                    key={meal.id}
                                    style={[
                                      styles.detailCard,
                                      mealIndex > 0 ? styles.detailCardSeparated : null,
                                    ]}>
                                    <View style={styles.detailCardHeader}>
                                      <View style={styles.detailCardCopy}>
                                        <AppText variant="bodyStrong">{meal.title}</AppText>
                                        <AppText variant="micro" dimmed>
                                          {`${formatMealLogMeta(meal)} • ${formatTimeLabel(meal.loggedAt)}`}
                                        </AppText>
                                      </View>
                                      <AppText variant="label" color={AppColors.textMuted}>
                                        {meal.calories} kcal
                                      </AppText>
                                    </View>
                                    <AppText variant="micro" dimmed>
                                      {`${meal.protein}P • ${meal.carbs}C • ${meal.fats}F`}
                                    </AppText>
                                  </View>
                                ))}
                              </View>
                            ) : null}
                          </View>

                          <View style={[styles.sectionBlock, styles.sectionBlockSeparated]}>
                            <PressScale
                              haptic="light"
                              disabled={day.workoutCount === 0}
                              onPress={() => toggleSection(day.id, 'workouts')}
                              pressEffect="opacity">
                              <View
                                style={[
                                  styles.sectionSummaryRow,
                                  day.workoutCount === 0 ? styles.sectionSummaryDisabled : null,
                                ]}>
                                <View style={styles.sectionSummaryLeading}>
                                  <View
                                    style={[
                                      styles.sectionIconWrap,
                                      styles.sectionIconWrapWorkout,
                                    ]}>
                                    <Ionicons
                                      name="barbell-outline"
                                      size={13}
                                      color={AppColors.primary}
                                    />
                                  </View>
                                  <View style={styles.sectionSummaryCopy}>
                                    <AppText variant="bodyStrong">Workout</AppText>
                                    <AppText variant="micro" dimmed>
                                      {day.workoutCount > 0
                                        ? `${day.workoutCount} logged`
                                        : 'No workout logged'}
                                    </AppText>
                                  </View>
                                </View>
                                <Ionicons
                                  name={workoutsOpen ? 'chevron-up' : 'chevron-down'}
                                  size={16}
                                  color={AppColors.textSubtle}
                                />
                              </View>
                            </PressScale>

                            {workoutsOpen ? (
                              <View style={styles.sectionDetailPanel}>
                                {day.workouts.map((workout, workoutIndex) => (
                                  <View
                                    key={workout.id}
                                    style={[
                                      styles.workoutDetailCard,
                                      workoutIndex > 0 ? styles.detailCardSeparated : null,
                                    ]}>
                                    <View style={styles.detailCardHeader}>
                                      <View style={styles.detailCardCopy}>
                                        <AppText variant="bodyStrong">{workout.title}</AppText>
                                        <AppText variant="micro" dimmed>
                                          {`${workout.timeLabel} • ${workout.durationLabel} • ${workout.exerciseCount} ex`}
                                        </AppText>
                                      </View>
                                    </View>

                                    <View style={styles.exerciseList}>
                                      {workout.exercises.map((exercise, exerciseIndex) => (
                                        <View
                                          key={exercise.id}
                                          style={[
                                            styles.exerciseBlock,
                                            exerciseIndex > 0
                                              ? styles.exerciseBlockSeparated
                                              : null,
                                          ]}>
                                          <AppText variant="label">{exercise.name}</AppText>
                                          <View style={styles.setList}>
                                            {exercise.sets.map((set) => (
                                              <View key={set.id} style={styles.setRow}>
                                                <AppText variant="micro" dimmed>
                                                  {set.setLabel}
                                                </AppText>
                                                <AppText variant="micro" dimmed>
                                                  {set.displayValue}
                                                </AppText>
                                              </View>
                                            ))}
                                          </View>
                                        </View>
                                      ))}
                                    </View>
                                  </View>
                                ))}
                              </View>
                            ) : null}
                          </View>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </>
          ) : null}
        </SurfaceCard>
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={consistencyOpen}
        onRequestClose={() => setConsistencyOpen(false)}>
        <View style={styles.modalScrim}>
          <SurfaceCard floating style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <PressScale
                haptic="light"
                disabled={!canGoToPreviousMonth}
                onPress={() => setCalendarMonthStart((currentValue) => addMonths(currentValue, -1))}>
                <View
                  style={[
                    styles.weekPagerButton,
                    !canGoToPreviousMonth ? styles.weekPagerButtonDisabled : null,
                  ]}>
                  <Ionicons name="chevron-back" size={16} color={AppColors.text} />
                </View>
              </PressScale>

              <View style={styles.modalHeaderCopy}>
                <AppText variant="title">Consistency</AppText>
                <AppText variant="micro" dimmed>
                  {formatMonthYear(calendarMonthStart)}
                </AppText>
              </View>

              <View style={styles.modalHeaderActions}>
                <PressScale
                  haptic="light"
                  disabled={!canGoToNextMonth}
                  onPress={() => setCalendarMonthStart((currentValue) => addMonths(currentValue, 1))}>
                  <View
                    style={[
                      styles.weekPagerButton,
                      !canGoToNextMonth ? styles.weekPagerButtonDisabled : null,
                    ]}>
                    <Ionicons name="chevron-forward" size={16} color={AppColors.text} />
                  </View>
                </PressScale>

                <PressScale haptic="light" onPress={() => setConsistencyOpen(false)}>
                  <View style={styles.calendarButton}>
                    <Ionicons name="close" size={18} color={AppColors.text} />
                  </View>
                </PressScale>
              </View>
            </View>

            <View style={styles.calendarWeekdaysRow}>
              {CALENDAR_WEEKDAY_LABELS.map((label) => (
                <View key={label} style={styles.calendarWeekdayCell}>
                  <AppText variant="micro" dimmed>
                    {label}
                  </AppText>
                </View>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarWeeks.map((week, weekIndex) => (
                <View key={`calendar-week-${weekIndex}`} style={styles.calendarWeekRow}>
                  {week.map((day) => (
                    <PressScale
                      key={day.dateKey}
                      haptic="none"
                      disabled={day.isFuture}
                      onPress={() => handleSelectCalendarDay(day.dateKey)}
                      pressEffect="opacity">
                      <View
                        style={[
                          styles.calendarDayCell,
                          !day.isCurrentMonth ? styles.calendarDayCellMuted : null,
                          day.isSelected ? styles.calendarDayCellSelected : null,
                          day.isFuture ? styles.calendarDayCellFuture : null,
                        ]}>
                        <AppText
                          variant="micro"
                          color={day.isCurrentMonth ? AppColors.text : AppColors.textSubtle}>
                          {String(day.dayNumber)}
                        </AppText>
                        <View style={styles.calendarDayDots}>
                          {day.tone === 'nutrition' || day.tone === 'both' ? (
                            <View style={[styles.calendarDot, styles.calendarDotNutrition]} />
                          ) : null}
                          {day.tone === 'workout' || day.tone === 'both' ? (
                            <View style={[styles.calendarDot, styles.calendarDotWorkout]} />
                          ) : null}
                        </View>
                      </View>
                    </PressScale>
                  ))}
                </View>
              ))}
            </View>

            <View style={styles.modalLegend}>
              <LegendPill label="Meals" tone="nutrition" />
              <LegendPill label="Gym" tone="workout" />
              <LegendPill label="Both" tone="both" />
            </View>
          </SurfaceCard>
        </View>
      </Modal>

      <GoalSettingsModal
        draft={goalDraft}
        isOpen={goalSettingsOpen}
        onChange={handleGoalDraftChange}
        onClose={() => setGoalSettingsOpen(false)}
        onRecalculate={handleRecalculateGoals}
        onSave={handleSaveGoals}
        onSelectSplit={handleSplitSelect}
      />
    </AppScreen>
  );
}

function getActivityToneStyle(tone: DayActivityTone) {
  switch (tone) {
    case 'nutrition':
      return styles.activityToneNutrition;
    case 'workout':
      return styles.activityToneWorkout;
    case 'both':
      return styles.activityToneBoth;
    default:
      return styles.activityToneEmpty;
  }
}

function LegendPill({
  label,
  tone,
}: {
  label: string;
  tone: 'both' | 'nutrition' | 'workout';
}) {
  return (
    <View style={styles.legendPill}>
      <View style={[styles.legendSwatch, getActivityToneStyle(tone)]} />
      <AppText variant="micro" dimmed>
        {label}
      </AppText>
    </View>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryTile}>
      <AppText variant="micro" dimmed>
        {label}
      </AppText>
      <AppText variant="headline">{value}</AppText>
    </View>
  );
}

function ActivityCountPill({
  color,
  icon,
  tone,
  value,
}: {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'nutrition' | 'workout';
  value: string;
}) {
  return (
    <View
      style={[
        styles.activityCountPill,
        tone === 'nutrition' ? styles.activityCountPillNutrition : styles.activityCountPillWorkout,
      ]}>
      <Ionicons name={icon} size={12} color={color} />
      <AppText variant="micro" color={color}>
        {value}
      </AppText>
    </View>
  );
}

function GoalSettingsModal({
  draft,
  isOpen,
  onChange,
  onClose,
  onRecalculate,
  onSave,
  onSelectSplit,
}: {
  draft: GoalPlanDraft;
  isOpen: boolean;
  onChange: <K extends keyof GoalPlanDraft>(key: K, value: GoalPlanDraft[K]) => void;
  onClose: () => void;
  onRecalculate: () => void;
  onSave: () => void;
  onSelectSplit: (split: WorkoutSplitPreset) => void;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={isOpen}>
      <View style={styles.modalScrim}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.goalModalContainer}>
          <SurfaceCard floating style={styles.goalModalCard}>
            <View style={styles.goalModalHeader}>
              <View style={styles.goalModalHeaderCopy}>
                <AppText variant="title">Goals</AppText>
                <AppText variant="body" dimmed>
                  Recalculate or override your targets anytime.
                </AppText>
              </View>
              <PressScale haptic="light" onPress={onClose}>
                <View style={styles.calendarButton}>
                  <Ionicons name="close" size={18} color={AppColors.text} />
                </View>
              </PressScale>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.goalModalScrollContent}>
              <View style={styles.goalModalSection}>
                <AppText variant="label" dimmed>
                  Profile inputs
                </AppText>

                <View style={styles.goalChoiceRow}>
                  {SEX_OPTIONS.map((option) => (
                    <SelectorChip
                      key={option.value}
                      label={option.label}
                      onPress={() => onChange('sex', option.value)}
                      selected={draft.sex === option.value}
                    />
                  ))}
                </View>

                <View style={styles.goalInputGrid}>
                  <GoalFieldInput
                    keyboardType="number-pad"
                    label="Age"
                    onChangeText={(value) => onChange('age', value)}
                    value={draft.age}
                  />
                  <GoalFieldInput
                    keyboardType="number-pad"
                    label="Height (in)"
                    onChangeText={(value) => onChange('heightInches', value)}
                    value={draft.heightInches}
                  />
                  <GoalFieldInput
                    keyboardType="decimal-pad"
                    label="Weight (lb)"
                    onChangeText={(value) => onChange('weightPounds', value)}
                    value={draft.weightPounds}
                  />
                </View>

                <View style={styles.goalChoiceWrap}>
                  {ACTIVITY_LEVEL_OPTIONS.map((option) => (
                    <SelectorChip
                      key={option.value}
                      label={option.label}
                      onPress={() => onChange('activityLevel', option.value)}
                      selected={draft.activityLevel === option.value}
                    />
                  ))}
                </View>

                <View style={styles.goalChoiceWrap}>
                  {NUTRITION_GOAL_OPTIONS.map((option) => (
                    <SelectorChip
                      key={option.value}
                      label={option.label}
                      onPress={() => onChange('nutritionGoal', option.value)}
                      selected={draft.nutritionGoal === option.value}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.goalModalSection}>
                <View style={styles.goalSectionHeaderRow}>
                  <AppText variant="label" dimmed>
                    Workout plan
                  </AppText>
                  <AppText variant="micro" dimmed>
                    Pick a split or set days manually.
                  </AppText>
                </View>

                <View style={styles.goalChoiceWrap}>
                  {WORKOUT_SPLIT_OPTIONS.map((option) => (
                    <SelectorChip
                      key={option.value}
                      label={option.label}
                      onPress={() => onSelectSplit(option.value)}
                      selected={draft.workoutSplitPreset === option.value}
                    />
                  ))}
                </View>

                <View style={styles.goalChoiceRow}>
                  {[2, 3, 4, 5, 6, 7].map((days) => (
                    <SelectorChip
                      key={days}
                      label={`${days} / wk`}
                      onPress={() => onChange('workoutsPerWeek', days)}
                      selected={draft.workoutsPerWeek === days}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.goalModalSection}>
                <View style={styles.goalSectionHeaderRow}>
                  <AppText variant="label" dimmed>
                    Targets
                  </AppText>
                  <PressScale haptic="light" onPress={onRecalculate} pressEffect="opacity">
                    <View style={styles.recalculateButton}>
                      <Ionicons name="refresh" size={14} color={AppColors.primary} />
                      <AppText variant="micro" color={AppColors.primary}>
                        Recalculate
                      </AppText>
                    </View>
                  </PressScale>
                </View>

                <View style={styles.goalInputGrid}>
                  <GoalFieldInput
                    keyboardType="number-pad"
                    label="Calories"
                    onChangeText={(value) => onChange('calories', value)}
                    value={draft.calories}
                  />
                  <GoalFieldInput
                    keyboardType="number-pad"
                    label="Protein"
                    onChangeText={(value) => onChange('protein', value)}
                    value={draft.protein}
                  />
                  <GoalFieldInput
                    keyboardType="number-pad"
                    label="Carbs"
                    onChangeText={(value) => onChange('carbs', value)}
                    value={draft.carbs}
                  />
                  <GoalFieldInput
                    keyboardType="number-pad"
                    label="Fats"
                    onChangeText={(value) => onChange('fats', value)}
                    value={draft.fats}
                  />
                </View>
              </View>
            </ScrollView>

            <PressScale haptic="light" onPress={onSave}>
              <View style={styles.goalSaveButton}>
                <AppText variant="label" color={AppColors.white}>
                  Save goals
                </AppText>
              </View>
            </PressScale>
          </SurfaceCard>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function SelectorChip({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <PressScale haptic="light" onPress={onPress} pressEffect="opacity">
      <View style={[styles.selectorChip, selected ? styles.selectorChipSelected : null]}>
        <AppText variant="micro" color={selected ? AppColors.primary : AppColors.textMuted}>
          {label}
        </AppText>
      </View>
    </PressScale>
  );
}

function GoalFieldInput({
  keyboardType,
  label,
  onChangeText,
  value,
}: {
  keyboardType: 'decimal-pad' | 'number-pad';
  label: string;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.goalInputCard}>
      <AppText variant="micro" dimmed>
        {label}
      </AppText>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        style={styles.goalInput}
        value={value}
      />
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

const styles = StyleSheet.create({
  activityCountPill: {
    minHeight: 24,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityCountPillNutrition: {
    backgroundColor: 'rgba(244, 180, 0, 0.18)',
  },
  activityCountPillWorkout: {
    backgroundColor: 'rgba(39, 116, 174, 0.12)',
  },
  activityToneBoth: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.secondary,
  },
  activityToneEmpty: {
    backgroundColor: AppColors.surfaceHighest,
    borderColor: 'rgba(29, 31, 36, 0.03)',
  },
  activityToneNutrition: {
    backgroundColor: 'rgba(254, 204, 0, 0.32)',
    borderColor: AppColors.secondary,
  },
  activityToneWorkout: {
    backgroundColor: 'rgba(30, 98, 152, 0.22)',
    borderColor: AppColors.primary,
  },
  calendarButton: {
    width: 34,
    height: 34,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayCell: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: AppColors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  calendarDayCellFuture: {
    opacity: 0.35,
  },
  calendarDayCellMuted: {
    opacity: 0.5,
  },
  calendarDayCellSelected: {
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceLowest,
  },
  calendarDayDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minHeight: 6,
  },
  calendarDot: {
    width: 5,
    height: 5,
    borderRadius: Radii.pill,
  },
  calendarDotNutrition: {
    backgroundColor: AppColors.secondary,
  },
  calendarDotWorkout: {
    backgroundColor: AppColors.primary,
  },
  calendarGrid: {
    gap: Spacing.sm,
  },
  calendarWeekdayCell: {
    width: 40,
    alignItems: 'center',
  },
  calendarWeekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  content: {
    paddingTop: Spacing.sm,
  },
  dayBlock: {
    gap: 6,
  },
  dayExpanded: {
    gap: Spacing.md,
    marginTop: -2,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingBottom: Spacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(29, 31, 36, 0.08)',
  },
  dayList: {
    gap: Spacing.sm,
  },
  dayRow: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: AppColors.outlineVariant,
    backgroundColor: AppColors.surfaceVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  dayRowCopy: {
    flex: 1,
    gap: 2,
  },
  dayRowExpanded: {
    backgroundColor: AppColors.surfaceLowest,
    borderColor: 'rgba(30, 98, 152, 0.18)',
  },
  dayRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailCard: {
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  detailCardCopy: {
    flex: 1,
    gap: 2,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  detailCardSeparated: {
    borderTopWidth: 1,
    borderTopColor: AppColors.outlineVariant,
    paddingTop: Spacing.md,
  },
  detailList: {
    gap: Spacing.sm,
  },
  exerciseBlock: {
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  exerciseBlockSeparated: {
    borderTopWidth: 1,
    borderTopColor: AppColors.outlineVariant,
  },
  exerciseList: {
    gap: 0,
  },
  goalDivider: {
    height: 1,
    backgroundColor: AppColors.outlineVariant,
  },
  goalInput: {
    color: AppColors.text,
    fontSize: 16,
    paddingVertical: 0,
  },
  goalInputCard: {
    flex: 1,
    minWidth: '46%',
    borderRadius: Radii.lg,
    backgroundColor: AppColors.surfaceVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  goalInputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  goalChoiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  goalChoiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
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
  goalMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  goalSection: {
    gap: Spacing.md,
  },
  goalSections: {
    gap: Spacing.lg,
  },
  goalModalCard: {
    width: '100%',
    maxWidth: 420,
    gap: Spacing.md,
  },
  goalModalContainer: {
    width: '100%',
    maxWidth: 420,
  },
  goalModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  goalModalHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  goalModalScrollContent: {
    gap: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  goalModalSection: {
    gap: Spacing.sm,
  },
  goalSaveButton: {
    minHeight: 46,
    borderRadius: Radii.lg,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  goalsCard: {
    gap: Spacing.lg,
  },
  gymGoalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  gymGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  header: {
    paddingTop: Spacing.xs,
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 4,
    borderWidth: 1,
  },
  logsCard: {
    gap: Spacing.md,
  },
  logsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    gap: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalHeaderCopy: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  modalLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(29, 31, 36, 0.24)',
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionSummaryCopy: {
    gap: 2,
  },
  sectionSummaryDisabled: {
    opacity: 0.5,
  },
  sectionSummaryLeading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionSummaryRow: {
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  sectionBlock: {
    gap: Spacing.sm,
  },
  sectionBlockSeparated: {
    borderTopWidth: 1,
    borderTopColor: AppColors.outlineVariant,
    paddingTop: Spacing.sm,
  },
  sectionDetailPanel: {
    borderRadius: Radii.md,
    backgroundColor: AppColors.surfaceVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconWrapNutrition: {
    backgroundColor: 'rgba(244, 180, 0, 0.14)',
  },
  sectionIconWrapWorkout: {
    backgroundColor: 'rgba(39, 116, 174, 0.10)',
  },
  setList: {
    gap: 4,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  stack: {
    gap: Spacing.md,
  },
  selectorChip: {
    minHeight: 30,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceVariant,
  },
  selectorChipSelected: {
    backgroundColor: 'rgba(39, 116, 174, 0.12)',
  },
  summaryTile: {
    flex: 1,
    borderRadius: Radii.lg,
    backgroundColor: AppColors.surfaceVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  weekPager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  weekPagerButton: {
    width: 32,
    height: 32,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekPagerButtonDisabled: {
    opacity: 0.35,
  },
  weekPagerCopy: {
    flex: 1,
    alignItems: 'center',
  },
  weekSummaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  workoutDetailCard: {
    gap: Spacing.sm,
  },
  recalculateButton: {
    minHeight: 28,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(39, 116, 174, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
