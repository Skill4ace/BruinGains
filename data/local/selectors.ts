import type {
  ActiveWorkoutSessionView,
  LocalAppData,
  MealLog,
  NutritionSummary,
  WeeklyActivityCard,
  WorkoutTemplateSummary,
} from '@/types/app-data';

const DAY_MS = 24 * 60 * 60 * 1000;

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

function addDays(date: Date, amount: number) {
  return new Date(date.getTime() + amount * DAY_MS);
}

function isSameLocalDay(left: string, rightDate: Date) {
  return startOfLocalDay(new Date(left)).getTime() === startOfLocalDay(rightDate).getTime();
}

function formatMonthDay(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function shortWeekday(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
  })
    .format(date)
    .slice(0, 1);
}

function getLatestActiveExerciseId(
  currentActiveExerciseId: string | null,
  exercises: ActiveWorkoutSessionView['exercises'],
) {
  if (currentActiveExerciseId) {
    const matchingExercise = exercises.find((exercise) => exercise.id === currentActiveExerciseId);

    if (matchingExercise && !matchingExercise.allSetsCompleted) {
      return currentActiveExerciseId;
    }
  }

  return exercises.find((exercise) => exercise.completedSets < exercise.targetSets)?.id ?? null;
}

function normalizeWorkoutSetView<T extends { completed?: boolean; setNumber?: number }>(
  workoutSet: T,
  fallbackSetNumber: number,
) {
  return {
    ...workoutSet,
    completed: workoutSet.completed ?? true,
    setType: 'setType' in workoutSet ? workoutSet.setType ?? 'normal' : 'normal',
    setNumber: workoutSet.setNumber ?? fallbackSetNumber,
  };
}

export function getMealLogsForDate(state: LocalAppData, date = new Date()) {
  return state.mealLogs
    .filter((meal) => isSameLocalDay(meal.loggedAt, date))
    .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt));
}

export function getNutritionSummaryForDate(
  state: LocalAppData,
  date = new Date(),
): NutritionSummary {
  return getMealLogsForDate(state, date).reduce(
    (summary, meal) => ({
      calories: summary.calories + meal.calories,
      protein: summary.protein + meal.protein,
      carbs: summary.carbs + meal.carbs,
      fats: summary.fats + meal.fats,
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    },
  );
}

export function getRecentMealLogs(
  state: LocalAppData,
  date = new Date(),
  limit = 4,
) {
  return getMealLogsForDate(state, date).slice(0, limit);
}

export function getWorkoutTemplateSummaries(state: LocalAppData): WorkoutTemplateSummary[] {
  return state.workoutTemplates
    .map((template) => ({
      ...template,
      exerciseCount: state.templateExercises.filter(
        (exercise) => exercise.templateId === template.id,
      ).length,
    }))
    .sort((left, right) => {
      const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.name.localeCompare(right.name);
    })
    .map(({ exerciseCount, ...template }) => ({
      ...template,
      exerciseCount,
    }));
}

export function getWeeklyActivityCards(
  state: LocalAppData,
  referenceDate = new Date(),
  weekCount = 3,
): WeeklyActivityCard[] {
  const currentWeekStart = startOfWeek(referenceDate);

  return Array.from({ length: weekCount }, (_, index) => {
    const start = addDays(currentWeekStart, (index - (weekCount - 1)) * 7);
    const end = addDays(start, 6);

    return {
      id: `week-${start.toISOString()}`,
      startDate: start.toISOString(),
      label: `${formatMonthDay(start)} - ${formatMonthDay(end)}`,
      days: Array.from({ length: 7 }, (_, dayIndex) => {
        const day = addDays(start, dayIndex);
        const workout = state.workoutSessions.some(
          (session) => Boolean(session.endedAt) && isSameLocalDay(session.startedAt, day),
        );
        const nutrition = state.mealLogs.some((meal) => isSameLocalDay(meal.loggedAt, day));

        return {
          id: `${start.toISOString()}-${dayIndex}`,
          day: shortWeekday(day),
          date: String(day.getDate()),
          workout,
          nutrition,
        };
      }),
    };
  });
}

export function getWeeklySummary(state: LocalAppData, referenceDate = new Date()) {
  const currentWeekStart = startOfWeek(referenceDate);
  const weekEnd = addDays(currentWeekStart, 6);

  const workouts = state.workoutSessions.filter((session) => {
    if (!session.endedAt) {
      return false;
    }

    const startedAt = new Date(session.startedAt).getTime();
    return (
      startedAt >= currentWeekStart.getTime() &&
      startedAt <= weekEnd.getTime() + DAY_MS - 1
    );
  }).length;

  const dailyTotals = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(currentWeekStart, index);
    return getNutritionSummaryForDate(state, day).calories;
  }).filter((calories) => calories > 0);

  const averageCalories =
    dailyTotals.length > 0
      ? Math.round(
          dailyTotals.reduce((total, calories) => total + calories, 0) / dailyTotals.length,
        )
      : 0;

  return [
    {
      id: 'workouts',
      label: 'Workouts',
      value: String(workouts),
    },
    {
      id: 'calories',
      label: 'Avg calories',
      value: averageCalories.toLocaleString(),
    },
  ];
}

export function getActiveWorkoutSessionView(
  state: LocalAppData,
): ActiveWorkoutSessionView | null {
  const sessionId = state.userPreferences.activeWorkoutSessionId;

  if (!sessionId) {
    return null;
  }

  const session = state.workoutSessions.find((candidate) => candidate.id === sessionId);

  if (!session) {
    return null;
  }

  const exercises = state.workoutSessionExercises
    .filter((exercise) => exercise.sessionId === sessionId)
    .sort((left, right) => left.order - right.order)
    .map((exercise) => {
      const existingSets = state.workoutSets
        .filter((set) => set.sessionExerciseId === exercise.id)
        .sort((left, right) => {
          const leftSetNumber = left.setNumber ?? Number.MAX_SAFE_INTEGER;
          const rightSetNumber = right.setNumber ?? Number.MAX_SAFE_INTEGER;

          if (leftSetNumber !== rightSetNumber) {
            return leftSetNumber - rightSetNumber;
          }

          return left.loggedAt.localeCompare(right.loggedAt);
        })
        .map((set, index) => normalizeWorkoutSetView(set, index + 1));
      const setCount = Math.max(exercise.targetSets, existingSets.length);
      const sets = Array.from({ length: setCount }, (_, index) => {
        const setNumber = index + 1;
        const matchingSet = existingSets.find((set) => set.setNumber === setNumber);

        return {
          completed: matchingSet?.completed ?? false,
          durationMinutes:
            matchingSet?.durationMinutes ?? exercise.targetDurationMinutes ?? null,
          id: matchingSet?.id ?? null,
          load: matchingSet?.load ?? exercise.currentLoad,
          reps: matchingSet?.reps ?? exercise.targetReps,
          setNumber,
          setType: matchingSet?.setType ?? 'normal',
        };
      });
      const completedSets = sets.filter((set) => set.completed).length;

      return {
        id: exercise.id,
        name: exercise.name,
        targetSets: exercise.targetSets,
        completedSets,
        allSetsCompleted: completedSets >= exercise.targetSets,
        repRange: exercise.repRange,
        previousLoadLabel: exercise.previousLoadLabel,
        currentLoad: exercise.currentLoad,
        targetReps: exercise.targetReps,
        targetDurationMinutes: exercise.targetDurationMinutes ?? null,
        trackingMode: exercise.trackingMode ?? 'strength',
        active: false,
        order: exercise.order,
        sets,
      };
    });

  const activeExerciseId = getLatestActiveExerciseId(session.activeExerciseId, exercises);

  return {
    session: {
      ...session,
      activeExerciseId,
    },
    exercises: exercises.map((exercise) => ({
      ...exercise,
      active: exercise.id === activeExerciseId,
    })),
  };
}

export function formatMealLogMeta(meal: MealLog) {
  const parts = [];

  if (meal.period === 'lateNight') {
    parts.push('Late Night');
  } else {
    parts.push(`${meal.period.slice(0, 1).toUpperCase()}${meal.period.slice(1)}`);
  }

  if (meal.hallName) {
    parts.push(meal.hallName);
  }

  if (meal.servings && meal.servings > 1) {
    parts.push(`${meal.servings} servings`);
  }

  return parts.join(' • ');
}

export function formatWorkoutTimerLabel(startedAt: string, referenceDate = new Date()) {
  const elapsedMs = Math.max(referenceDate.getTime() - new Date(startedAt).getTime(), 0);
  const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));
  const minutes = String(elapsedMinutes).padStart(2, '0');
  const seconds = String(Math.floor((elapsedMs % (60 * 1000)) / 1000)).padStart(2, '0');
  return `${minutes}:${seconds}`;
}
