import { buildSeededExerciseLibrary, mergeExerciseLibrary } from '@/data/local/exercise-library';
import { calculateGoalTargets } from '@/lib/goal-calculator';
import type {
  LocalAppData,
  MealPeriod,
  ProfileActivityLevel,
  WorkoutTemplateExercise,
  WorkoutTemplateSet,
} from '@/types/app-data';

function normalizeActivityLevel(
  value: LocalAppData['profile']['activityLevel'] | string | undefined,
): ProfileActivityLevel {
  if (
    value === 'inactive' ||
    value === 'low_active' ||
    value === 'active' ||
    value === 'very_active'
  ) {
    return value;
  }

  if (value === 'sedentary') {
    return 'inactive';
  }

  if (value === 'light') {
    return 'low_active';
  }

  if (value === 'moderate') {
    return 'active';
  }

  return 'very_active';
}

function getCurrentPeriod(now: Date): MealPeriod {
  const hour = now.getHours() + now.getMinutes() / 60;

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

function buildFallbackTemplateExerciseSets(
  templateExercises: WorkoutTemplateExercise[],
): WorkoutTemplateSet[] {
  return templateExercises.flatMap((exercise) =>
    Array.from({ length: exercise.targetSets }, (_, index) => ({
      id: `${exercise.id}-set-${index + 1}`,
      templateExerciseId: exercise.id,
      durationMinutes:
        exercise.trackingMode === 'duration'
          ? exercise.targetDurationMinutes ?? 20
          : null,
      load: exercise.currentLoad,
      reps: exercise.targetReps,
      setNumber: index + 1,
      setType: 'normal' as const,
    })),
  );
}

export function createDefaultLocalAppData(now = new Date()): LocalAppData {
  const defaultProfile = {
    age: 20,
    activityLevel: 'low_active' as const,
    heightInches: 69,
    nutritionGoal: 'maintain' as const,
    sex: 'male' as const,
    weightPounds: 165,
  };
  const calculatedGoals = calculateGoalTargets(defaultProfile);

  return {
    profile: {
      id: 'local-profile',
      age: defaultProfile.age,
      activityLevel: defaultProfile.activityLevel,
      displayName: '',
      campusRole: '',
      heightInches: defaultProfile.heightInches,
      primaryGoal: '',
      nutritionGoal: defaultProfile.nutritionGoal,
      sex: defaultProfile.sex,
      weightPounds: defaultProfile.weightPounds,
    },
    goals: {
      calories: calculatedGoals.calories,
      protein: calculatedGoals.protein,
      carbs: calculatedGoals.carbs,
      fats: calculatedGoals.fats,
      workoutsPerWeek: 4,
    },
    mealLogs: [],
    exerciseLibrary: buildSeededExerciseLibrary([]),
    workoutTemplates: [],
    templateExercises: [],
    templateExerciseSets: [],
    workoutSessions: [],
    workoutSessionExercises: [],
    workoutSets: [],
    personalRecords: [],
    achievements: [],
    userPreferences: {
      activeWorkoutSessionId: null,
      preferredDiningPeriod: getCurrentPeriod(now),
      favoriteHallIds: [],
    },
  };
}

export function mergeLocalAppData(
  candidate: Partial<LocalAppData> | undefined,
  now = new Date(),
): LocalAppData {
  const seed = createDefaultLocalAppData(now);

  if (!candidate) {
    return seed;
  }

  const normalizedProfile = candidate.profile
    ? {
        ...candidate.profile,
        activityLevel: normalizeActivityLevel(candidate.profile.activityLevel),
      }
    : undefined;
  const nextWorkoutTemplates = [...(candidate.workoutTemplates ?? [])]
    .sort((left, right) => {
      const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.name.localeCompare(right.name);
    })
    .map((template, index) => ({
      ...template,
      order: index,
    }));
  const nextTemplateExercises = candidate.templateExercises ?? [];
  const nextTemplateExerciseSets =
    candidate.templateExerciseSets && candidate.templateExerciseSets.length > 0
      ? candidate.templateExerciseSets.filter((set) =>
          nextTemplateExercises.some((exercise) => exercise.id === set.templateExerciseId),
        )
      : buildFallbackTemplateExerciseSets(nextTemplateExercises);

  return {
    ...seed,
    ...candidate,
    profile: {
      ...seed.profile,
      ...normalizedProfile,
    },
    goals: {
      ...seed.goals,
      ...candidate.goals,
    },
    mealLogs: candidate.mealLogs ?? seed.mealLogs,
    exerciseLibrary: mergeExerciseLibrary(candidate.exerciseLibrary, seed.exerciseLibrary),
    workoutTemplates: nextWorkoutTemplates,
    templateExercises: nextTemplateExercises,
    templateExerciseSets: nextTemplateExerciseSets,
    workoutSessions: candidate.workoutSessions ?? seed.workoutSessions,
    workoutSessionExercises: candidate.workoutSessionExercises ?? seed.workoutSessionExercises,
    workoutSets: candidate.workoutSets ?? seed.workoutSets,
    personalRecords: candidate.personalRecords ?? seed.personalRecords,
    achievements: candidate.achievements ?? seed.achievements,
    userPreferences: {
      ...seed.userPreferences,
      ...candidate.userPreferences,
    },
  };
}
