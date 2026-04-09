import { diningPreview, gymPreview } from '@/constants/preview-data';
import type {
  Achievement,
  GoalSettings,
  LocalAppData,
  MealLog,
  MealLogPeriod,
  MealPeriod,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSet,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from '@/types/app-data';

const DAY_MS = 24 * 60 * 60 * 1000;

type TemplateSeed = {
  name: string;
  focus: string;
  exercises: Array<{
    name: string;
    targetSets: number;
    repRange: string;
    previousLoadLabel: string;
    defaultLoad: number;
    defaultReps: number;
  }>;
};

const templateSeeds: TemplateSeed[] = [
  {
    name: 'Push',
    focus: 'Upper body',
    exercises: [
      { name: 'Barbell Bench Press', targetSets: 4, repRange: '6-8 reps', previousLoadLabel: '175 lbs', defaultLoad: 185, defaultReps: 8 },
      { name: 'Incline Dumbbell Press', targetSets: 3, repRange: '8-10 reps', previousLoadLabel: '60 lbs', defaultLoad: 65, defaultReps: 10 },
      { name: 'Seated Shoulder Press', targetSets: 3, repRange: '8-10 reps', previousLoadLabel: '45 lbs', defaultLoad: 50, defaultReps: 8 },
      { name: 'Lateral Raise', targetSets: 3, repRange: '12-15 reps', previousLoadLabel: '20 lbs', defaultLoad: 22.5, defaultReps: 12 },
      { name: 'Tricep Pressdown', targetSets: 3, repRange: '12 reps', previousLoadLabel: '55 lbs', defaultLoad: 60, defaultReps: 12 },
    ],
  },
  {
    name: 'Legs',
    focus: 'Lower body',
    exercises: [
      { name: 'Bulgarian Split Squat', targetSets: 4, repRange: '8-10 reps', previousLoadLabel: '95 lbs', defaultLoad: 105, defaultReps: 10 },
      { name: 'Barbell Back Squat', targetSets: 4, repRange: '6-8 reps', previousLoadLabel: '205 lbs', defaultLoad: 225, defaultReps: 8 },
      { name: 'Leg Press', targetSets: 3, repRange: '12 reps', previousLoadLabel: '360 lbs', defaultLoad: 405, defaultReps: 12 },
      { name: 'Romanian Deadlift', targetSets: 3, repRange: '8-10 reps', previousLoadLabel: '165 lbs', defaultLoad: 185, defaultReps: 8 },
      { name: 'Hamstring Curl', targetSets: 3, repRange: '12-15 reps', previousLoadLabel: '90 lbs', defaultLoad: 95, defaultReps: 12 },
    ],
  },
  {
    name: 'Pull',
    focus: 'Pull focus',
    exercises: [
      { name: 'Weighted Pull-Up', targetSets: 4, repRange: '6 reps', previousLoadLabel: '+25 lbs', defaultLoad: 25, defaultReps: 6 },
      { name: 'Barbell Row', targetSets: 4, repRange: '8 reps', previousLoadLabel: '145 lbs', defaultLoad: 155, defaultReps: 8 },
      { name: 'Lat Pulldown', targetSets: 3, repRange: '10 reps', previousLoadLabel: '130 lbs', defaultLoad: 140, defaultReps: 10 },
      { name: 'Face Pull', targetSets: 3, repRange: '12-15 reps', previousLoadLabel: '45 lbs', defaultLoad: 50, defaultReps: 12 },
      { name: 'Hammer Curl', targetSets: 3, repRange: '10-12 reps', previousLoadLabel: '30 lbs', defaultLoad: 35, defaultReps: 10 },
    ],
  },
  {
    name: 'Upper',
    focus: 'Mixed split',
    exercises: [
      { name: 'Incline Barbell Press', targetSets: 4, repRange: '6-8 reps', previousLoadLabel: '135 lbs', defaultLoad: 145, defaultReps: 8 },
      { name: 'Chest Supported Row', targetSets: 4, repRange: '8 reps', previousLoadLabel: '75 lbs', defaultLoad: 80, defaultReps: 8 },
      { name: 'Cable Fly', targetSets: 3, repRange: '12 reps', previousLoadLabel: '25 lbs', defaultLoad: 27.5, defaultReps: 12 },
      { name: 'Machine Shoulder Press', targetSets: 3, repRange: '10 reps', previousLoadLabel: '100 lbs', defaultLoad: 110, defaultReps: 10 },
      { name: 'EZ Bar Curl', targetSets: 3, repRange: '10 reps', previousLoadLabel: '65 lbs', defaultLoad: 70, defaultReps: 10 },
    ],
  },
];

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

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

function withTime(date: Date, hour: number, minute: number) {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next.toISOString();
}

function formatMonthDay(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
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

function createMealLog(
  title: string,
  period: MealLogPeriod,
  date: Date,
  calories: number,
  protein: number,
  carbs: number,
  fats: number,
  hallId?: string,
): MealLog {
  return {
    id: createId('meal'),
    title,
    period,
    loggedAt: date.toISOString(),
    calories,
    protein,
    carbs,
    fats,
    source: hallId ? 'dining' : 'manual',
    hallId,
  };
}

function buildSeedMealLogs(now: Date) {
  const today = startOfLocalDay(now);
  const currentWeekStart = startOfWeek(now);
  const lastWeekStart = addDays(currentWeekStart, -7);
  const twoWeeksAgoStart = addDays(currentWeekStart, -14);

  return [
    createMealLog('Protein oats', 'breakfast', new Date(withTime(today, 8, 15)), 420, 32, 54, 12),
    createMealLog('Harissa chicken bowl', 'lunch', new Date(withTime(today, 12, 20)), 610, 46, 68, 18, 'bruin-plate'),
    createMealLog('Greek yogurt', 'snack', new Date(withTime(today, 15, 10)), 190, 18, 14, 6),
    createMealLog('Salmon rice plate', 'dinner', new Date(withTime(today, 19, 5)), 620, 42, 56, 22, 'epicuria-covel'),
    createMealLog('Campus dining total', 'dinner', new Date(withTime(addDays(currentWeekStart, 2), 18, 40)), 2280, 155, 241, 66, 'de-neve'),
    createMealLog('Campus dining total', 'lunch', new Date(withTime(addDays(currentWeekStart, 1), 13, 10)), 2170, 148, 236, 62, 'bruin-cafe'),
    createMealLog('Campus dining total', 'breakfast', new Date(withTime(addDays(currentWeekStart, 0), 9, 5)), 2090, 150, 225, 58, 'de-neve'),
    createMealLog('Campus dining total', 'dinner', new Date(withTime(addDays(lastWeekStart, 6), 18, 30)), 2310, 164, 244, 70, 'epicuria-covel'),
    createMealLog('Campus dining total', 'lunch', new Date(withTime(addDays(lastWeekStart, 5), 12, 25)), 2140, 145, 232, 61, 'feast-rieber'),
    createMealLog('Campus dining total', 'dinner', new Date(withTime(addDays(lastWeekStart, 2), 18, 0)), 2265, 159, 243, 63, 'study-hedrick'),
    createMealLog('Campus dining total', 'lunch', new Date(withTime(addDays(lastWeekStart, 1), 12, 15)), 2200, 153, 238, 64, 'rendezvous'),
    createMealLog('Campus dining total', 'breakfast', new Date(withTime(addDays(lastWeekStart, 0), 8, 45)), 2050, 142, 222, 59, 'de-neve'),
    createMealLog('Campus dining total', 'dinner', new Date(withTime(addDays(twoWeeksAgoStart, 6), 18, 10)), 2290, 161, 240, 67, 'bruin-plate'),
    createMealLog('Campus dining total', 'dinner', new Date(withTime(addDays(twoWeeksAgoStart, 4), 18, 50)), 2165, 149, 228, 62, 'epicuria-covel'),
    createMealLog('Campus dining total', 'lunch', new Date(withTime(addDays(twoWeeksAgoStart, 3), 12, 35)), 2120, 147, 230, 60, 'the-drey'),
    createMealLog('Campus dining total', 'lunch', new Date(withTime(addDays(twoWeeksAgoStart, 1), 12, 5)), 2185, 151, 236, 61, 'bruin-cafe'),
    createMealLog('Campus dining total', 'breakfast', new Date(withTime(addDays(twoWeeksAgoStart, 0), 8, 55)), 2060, 143, 220, 58, 'de-neve'),
  ].sort((left, right) => left.loggedAt.localeCompare(right.loggedAt));
}

function buildTemplateState(now: Date) {
  const createdAt = now.toISOString();
  const workoutTemplates: WorkoutTemplate[] = [];
  const templateExercises: WorkoutTemplateExercise[] = [];

  templateSeeds.forEach((seed) => {
    const templateId = seed.name.toLowerCase();
    workoutTemplates.push({
      id: templateId,
      name: seed.name,
      focus: seed.focus,
      createdAt,
      updatedAt: createdAt,
    });

    seed.exercises.forEach((exercise, index) => {
      templateExercises.push({
        id: `${templateId}-${index + 1}`,
        templateId,
        name: exercise.name,
        targetSets: exercise.targetSets,
        repRange: exercise.repRange,
        previousLoadLabel: exercise.previousLoadLabel,
        defaultLoad: exercise.defaultLoad,
        defaultReps: exercise.defaultReps,
        order: index,
      });
    });
  });

  return { workoutTemplates, templateExercises };
}

function cloneTemplateIntoSession(
  templateId: string,
  sessionId: string,
  stateTemplateExercises: WorkoutTemplateExercise[],
): WorkoutSessionExercise[] {
  return stateTemplateExercises
    .filter((exercise) => exercise.templateId === templateId)
    .sort((left, right) => left.order - right.order)
    .map((exercise) => ({
      id: createId('session-exercise'),
      sessionId,
      templateExerciseId: exercise.id,
      name: exercise.name,
      targetSets: exercise.targetSets,
      repRange: exercise.repRange,
      previousLoadLabel: exercise.previousLoadLabel,
      currentLoad: exercise.defaultLoad,
      targetReps: exercise.defaultReps,
      order: exercise.order,
    }));
}

function buildSeedWorkoutHistory(now: Date, templateExercises: WorkoutTemplateExercise[]) {
  const currentWeekStart = startOfWeek(now);
  const workoutSessions: WorkoutSession[] = [];
  const workoutSessionExercises: WorkoutSessionExercise[] = [];
  const workoutSets: WorkoutSet[] = [];

  const sessionSeeds = [
    { templateId: 'legs', title: 'Leg Day', day: addDays(currentWeekStart, 2), hour: 17 },
    { templateId: 'push', title: 'Push Day', day: addDays(currentWeekStart, 0), hour: 16 },
    { templateId: 'upper', title: 'Upper', day: addDays(addDays(currentWeekStart, -7), 6), hour: 11 },
    { templateId: 'pull', title: 'Pull Day', day: addDays(addDays(currentWeekStart, -7), 1), hour: 18 },
    { templateId: 'legs', title: 'Leg Day', day: addDays(addDays(currentWeekStart, -14), 4), hour: 15 },
  ];

  sessionSeeds.forEach((seed) => {
    const sessionId = createId('session');
    const startedAt = new Date(withTime(seed.day, seed.hour, 10));
    const finishedAt = new Date(startedAt.getTime() + 50 * 60 * 1000);
    const sessionExercises = cloneTemplateIntoSession(seed.templateId, sessionId, templateExercises);

    workoutSessions.push({
      id: sessionId,
      title: seed.title,
      templateId: seed.templateId,
      startedAt: startedAt.toISOString(),
      endedAt: finishedAt.toISOString(),
      activeExerciseId: null,
    });

    workoutSessionExercises.push(...sessionExercises);

    sessionExercises.forEach((exercise) => {
      const completedSets = Math.max(exercise.targetSets - 1, 2);

      for (let setIndex = 0; setIndex < completedSets; setIndex += 1) {
        workoutSets.push({
          id: createId('set'),
          sessionId,
          sessionExerciseId: exercise.id,
          load: exercise.currentLoad,
          reps: exercise.targetReps,
          loggedAt: new Date(startedAt.getTime() + (setIndex + exercise.order) * 6 * 60 * 1000).toISOString(),
        });
      }
    });
  });

  return {
    workoutSessions,
    workoutSessionExercises,
    workoutSets,
  };
}

function buildAchievements(now: Date): Achievement[] {
  const yesterday = addDays(startOfLocalDay(now), -1);
  const twoDaysAgo = addDays(startOfLocalDay(now), -2);
  const fourDaysAgo = addDays(startOfLocalDay(now), -4);
  const tenDaysAgo = addDays(startOfLocalDay(now), -10);

  return [
    {
      id: 'achievement-first-workout',
      title: 'First workout logged',
      detail: 'Started your first session in Bruin Gains',
      date: formatMonthDay(yesterday),
      icon: 'barbell-outline',
      tone: 'workout',
    },
    {
      id: 'achievement-protein-streak',
      title: 'Protein streak',
      detail: 'Hit your protein goal 5 days in a row',
      date: formatMonthDay(twoDaysAgo),
      icon: 'flame-outline',
      tone: 'nutrition',
    },
    {
      id: 'achievement-hall-hopper',
      title: 'Hall hopper',
      detail: 'Tried 3 different UCLA dining halls this week',
      date: formatMonthDay(fourDaysAgo),
      icon: 'restaurant-outline',
      tone: 'nutrition',
    },
    {
      id: 'achievement-finals-week',
      title: 'Survived finals week nutrition',
      detail: 'Stayed on plan during a heavy school week',
      date: formatMonthDay(tenDaysAgo),
      icon: 'school-outline',
      tone: 'nutrition',
    },
  ];
}

export function createDefaultLocalAppData(now = new Date()): LocalAppData {
  const goals: GoalSettings = {
    calories: diningPreview.calorieGoal,
    protein: diningPreview.proteinGoal,
    carbs: diningPreview.carbGoal,
    fats: diningPreview.fatGoal,
    workoutsPerWeek: 4,
  };

  const { workoutTemplates, templateExercises } = buildTemplateState(now);
  const workoutHistory = buildSeedWorkoutHistory(now, templateExercises);
  const mealLogs = buildSeedMealLogs(now);
  const exerciseLibrary = templateExercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    focus:
      workoutTemplates.find((template) => template.id === exercise.templateId)?.focus ??
      gymPreview.templates[0],
  }));

  return {
    profile: {
      id: 'local-profile',
      displayName: 'Bruin',
      campusRole: 'UCLA student',
      primaryGoal: 'Stay consistent with dining and lifting',
    },
    goals,
    mealLogs,
    exerciseLibrary,
    workoutTemplates,
    templateExercises,
    workoutSessions: workoutHistory.workoutSessions,
    workoutSessionExercises: workoutHistory.workoutSessionExercises,
    workoutSets: workoutHistory.workoutSets,
    personalRecords: [
      {
        id: 'pr-back-squat',
        exerciseName: 'Barbell Back Squat',
        weight: 225,
        reps: 8,
        achievedAt: addDays(startOfLocalDay(now), -6).toISOString(),
      },
      {
        id: 'pr-bench',
        exerciseName: 'Barbell Bench Press',
        weight: 185,
        reps: 8,
        achievedAt: addDays(startOfLocalDay(now), -12).toISOString(),
      },
    ],
    achievements: buildAchievements(now),
    userPreferences: {
      activeWorkoutSessionId: null,
      preferredDiningPeriod: getCurrentPeriod(now),
      favoriteHallIds: ['bruin-plate', 'de-neve'],
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

  return {
    ...seed,
    ...candidate,
    profile: {
      ...seed.profile,
      ...candidate.profile,
    },
    goals: {
      ...seed.goals,
      ...candidate.goals,
    },
    mealLogs: candidate.mealLogs ?? seed.mealLogs,
    exerciseLibrary: candidate.exerciseLibrary ?? seed.exerciseLibrary,
    workoutTemplates: candidate.workoutTemplates ?? seed.workoutTemplates,
    templateExercises: candidate.templateExercises ?? seed.templateExercises,
    workoutSessions: candidate.workoutSessions ?? seed.workoutSessions,
    workoutSessionExercises:
      candidate.workoutSessionExercises ?? seed.workoutSessionExercises,
    workoutSets: candidate.workoutSets ?? seed.workoutSets,
    personalRecords: candidate.personalRecords ?? seed.personalRecords,
    achievements: candidate.achievements ?? seed.achievements,
    userPreferences: {
      ...seed.userPreferences,
      ...candidate.userPreferences,
    },
  };
}
