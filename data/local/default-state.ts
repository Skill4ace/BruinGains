import { diningPreview, gymPreview } from '@/constants/preview-data';
import { buildSeededExerciseLibrary, mergeExerciseLibrary } from '@/data/local/exercise-library';
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
  WorkoutTemplateSet,
} from '@/types/app-data';

const DAY_MS = 24 * 60 * 60 * 1000;

type TemplateSeed = {
  name: string;
  focus: string;
  exercises: {
    name: string;
    targetSets: number;
    repRange: string;
    previousLoadLabel: string;
    defaultLoad: number;
    defaultReps: number;
  }[];
};

const templateSeeds: TemplateSeed[] = [
  {
    name: 'Push',
    focus: 'Push day',
    exercises: [
      { name: 'Barbell Bench Press', targetSets: 4, repRange: '5-8 reps', previousLoadLabel: '185 lbs', defaultLoad: 195, defaultReps: 6 },
      { name: 'Barbell Incline Bench Press', targetSets: 3, repRange: '8-10 reps', previousLoadLabel: '135 lbs', defaultLoad: 145, defaultReps: 8 },
      { name: 'Dumbbell Seated Shoulder Press', targetSets: 3, repRange: '8-10 reps', previousLoadLabel: '50 lbs', defaultLoad: 55, defaultReps: 8 },
      { name: 'Dumbbell Lateral Raise', targetSets: 3, repRange: '12-15 reps', previousLoadLabel: '20 lbs', defaultLoad: 25, defaultReps: 12 },
      { name: 'Cable Standing Fly', targetSets: 3, repRange: '12-15 reps', previousLoadLabel: '20 lbs', defaultLoad: 25, defaultReps: 12 },
      { name: 'Cable Pushdown (with Rope Attachment)', targetSets: 3, repRange: '10-12 reps', previousLoadLabel: '55 lbs', defaultLoad: 60, defaultReps: 10 },
    ],
  },
  {
    name: 'Pull',
    focus: 'Pull day',
    exercises: [
      { name: 'Weighted Pull-up', targetSets: 4, repRange: '5-8 reps', previousLoadLabel: '+25 lbs', defaultLoad: 25, defaultReps: 6 },
      { name: 'Barbell Bent Over Row', targetSets: 4, repRange: '6-10 reps', previousLoadLabel: '155 lbs', defaultLoad: 165, defaultReps: 8 },
      { name: 'Cable Lat Pulldown Full Range Of Motion', targetSets: 3, repRange: '8-12 reps', previousLoadLabel: '130 lbs', defaultLoad: 140, defaultReps: 10 },
      { name: 'Cable Rear Delt Row (with Rope)', targetSets: 3, repRange: '12-15 reps', previousLoadLabel: '45 lbs', defaultLoad: 50, defaultReps: 12 },
      { name: 'Cable Hammer Curl (with Rope)', targetSets: 3, repRange: '10-12 reps', previousLoadLabel: '30 lbs', defaultLoad: 35, defaultReps: 10 },
      { name: 'Barbell Preacher Curl', targetSets: 3, repRange: '8-12 reps', previousLoadLabel: '60 lbs', defaultLoad: 65, defaultReps: 10 },
    ],
  },
  {
    name: 'Legs',
    focus: 'Leg day',
    exercises: [
      { name: 'Barbell Full Squat', targetSets: 4, repRange: '5-8 reps', previousLoadLabel: '225 lbs', defaultLoad: 235, defaultReps: 6 },
      { name: 'Sled 45° Leg Press', targetSets: 3, repRange: '10-15 reps', previousLoadLabel: '360 lbs', defaultLoad: 405, defaultReps: 12 },
      { name: 'Barbell Romanian Deadlift', targetSets: 3, repRange: '6-10 reps', previousLoadLabel: '185 lbs', defaultLoad: 195, defaultReps: 8 },
      { name: 'Lever Seated Leg Curl', targetSets: 3, repRange: '10-15 reps', previousLoadLabel: '95 lbs', defaultLoad: 105, defaultReps: 12 },
      { name: 'Barbell Lunge', targetSets: 3, repRange: '8-10 reps', previousLoadLabel: '95 lbs', defaultLoad: 105, defaultReps: 8 },
      { name: 'Lever Standing Calf Raise', targetSets: 4, repRange: '12-20 reps', previousLoadLabel: '140 lbs', defaultLoad: 150, defaultReps: 15 },
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
  const templateExerciseSets: WorkoutTemplateSet[] = [];

  templateSeeds.forEach((seed) => {
    const templateId = seed.name.toLowerCase();
    workoutTemplates.push({
      id: templateId,
      name: seed.name,
      createdAt,
      order: workoutTemplates.length,
      updatedAt: createdAt,
    });

    seed.exercises.forEach((exercise, index) => {
      templateExercises.push({
        id: `${templateId}-${index + 1}`,
        templateId,
        name: exercise.name,
        targetSets: exercise.targetSets,
        repRange: exercise.repRange,
        trackingMode: 'strength',
        currentLoad: exercise.defaultLoad,
        targetReps: exercise.defaultReps,
        targetDurationMinutes: null,
        order: index,
      });

      for (let setIndex = 0; setIndex < exercise.targetSets; setIndex += 1) {
        templateExerciseSets.push({
          id: `${templateId}-${index + 1}-set-${setIndex + 1}`,
          templateExerciseId: `${templateId}-${index + 1}`,
          durationMinutes: null,
          load: exercise.defaultLoad,
          reps: exercise.defaultReps,
          setNumber: setIndex + 1,
          setType: 'normal',
        });
      }
    });
  });

  return { workoutTemplates, templateExercises, templateExerciseSets };
}

function cloneTemplateIntoSession(
  templateId: string,
  sessionId: string,
  stateTemplateExercises: WorkoutTemplateExercise[],
  stateTemplateExerciseSets: WorkoutTemplateSet[],
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
      previousLoadLabel: 'No previous workout',
      currentLoad: exercise.currentLoad,
      targetReps: exercise.targetReps,
      targetDurationMinutes: exercise.targetDurationMinutes ?? null,
      trackingMode: exercise.trackingMode ?? 'strength',
      order: exercise.order,
    }));
}

function cloneTemplateSetsIntoSession(
  templateExerciseIdToSessionExerciseId: Map<string, WorkoutSessionExercise>,
  sessionId: string,
  stateTemplateExerciseSets: WorkoutTemplateSet[],
) {
  return stateTemplateExerciseSets
    .filter((set) => templateExerciseIdToSessionExerciseId.has(set.templateExerciseId))
    .sort((left, right) => left.setNumber - right.setNumber)
    .map((set) => {
      const sessionExercise = templateExerciseIdToSessionExerciseId.get(set.templateExerciseId)!;

      return {
        completed: false,
        durationMinutes: set.durationMinutes ?? sessionExercise.targetDurationMinutes ?? null,
        id: createId('set'),
        load: set.load,
        reps: set.reps,
        loggedAt: new Date().toISOString(),
        sessionExerciseId: sessionExercise.id,
        sessionId,
        setNumber: set.setNumber,
        setType: set.setType ?? 'normal',
      };
    });
}

function buildSeedWorkoutHistory(
  now: Date,
  templateExercises: WorkoutTemplateExercise[],
  templateExerciseSets: WorkoutTemplateSet[],
) {
  const currentWeekStart = startOfWeek(now);
  const workoutSessions: WorkoutSession[] = [];
  const workoutSessionExercises: WorkoutSessionExercise[] = [];
  const workoutSets: WorkoutSet[] = [];

  const sessionSeeds = [
    { templateId: 'legs', title: 'Leg Day', day: addDays(currentWeekStart, 2), hour: 17 },
    { templateId: 'push', title: 'Push Day', day: addDays(currentWeekStart, 0), hour: 16 },
    { templateId: 'pull', title: 'Pull Day', day: addDays(addDays(currentWeekStart, -7), 6), hour: 11 },
    { templateId: 'pull', title: 'Pull Day', day: addDays(addDays(currentWeekStart, -7), 1), hour: 18 },
    { templateId: 'legs', title: 'Leg Day', day: addDays(addDays(currentWeekStart, -14), 4), hour: 15 },
  ];
  const seededWorkoutDays = new Set<string>();

  sessionSeeds.forEach((seed) => {
    const seedDayKey = startOfLocalDay(seed.day).toISOString().slice(0, 10);

    if (seededWorkoutDays.has(seedDayKey)) {
      return;
    }

    seededWorkoutDays.add(seedDayKey);

    const sessionId = createId('session');
    const startedAt = new Date(withTime(seed.day, seed.hour, 10));
    const finishedAt = new Date(startedAt.getTime() + 50 * 60 * 1000);
    const sessionExercises = cloneTemplateIntoSession(
      seed.templateId,
      sessionId,
      templateExercises,
      templateExerciseSets,
    );
    const exerciseMap = new Map(
      sessionExercises.map((exercise) => [exercise.templateExerciseId ?? '', exercise]),
    );

    workoutSessions.push({
      id: sessionId,
      title: seed.title,
      templateId: seed.templateId,
      startedAt: startedAt.toISOString(),
      endedAt: finishedAt.toISOString(),
      activeExerciseId: null,
    });

    workoutSessionExercises.push(...sessionExercises);
    const seededSets = cloneTemplateSetsIntoSession(
      exerciseMap,
      sessionId,
      templateExerciseSets,
    );

    seededSets.forEach((set, setIndex) => {
      workoutSets.push({
        ...set,
        completed: setIndex % Math.max(1, Math.floor(seededSets.length / 2)) !== 0,
        loggedAt: new Date(startedAt.getTime() + (setIndex + 1) * 6 * 60 * 1000).toISOString(),
      });
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

  const { workoutTemplates, templateExercises, templateExerciseSets } = buildTemplateState(now);
  const workoutHistory = buildSeedWorkoutHistory(now, templateExercises, templateExerciseSets);
  const mealLogs = buildSeedMealLogs(now);
  const exerciseLibrary = buildSeededExerciseLibrary(
    templateExercises.map((exercise) => ({
      name: exercise.name,
      focus: gymPreview.templates[0],
    })),
  );

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
    templateExerciseSets,
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
  const legacySeedTemplateIds = new Set(['push', 'pull', 'legs', 'upper']);

  if (!candidate) {
    return seed;
  }

  const customWorkoutTemplates = (candidate.workoutTemplates ?? [])
    .filter((template) => !legacySeedTemplateIds.has(template.id))
    .map((template, index) => ({
      ...template,
      order: seed.workoutTemplates.length + index,
    }));
  const nextWorkoutTemplates = [...seed.workoutTemplates, ...customWorkoutTemplates];
  const customTemplateExercises = (candidate.templateExercises ?? []).filter(
    (exercise) => !legacySeedTemplateIds.has(exercise.templateId),
  );
  const customTemplateExerciseSets = candidate.templateExerciseSets ?? [];
  const fallbackTemplateExerciseSets = [
    ...seed.templateExerciseSets,
    ...customTemplateExercises.flatMap((exercise) =>
      Array.from({ length: exercise.targetSets }, (_, index) => ({
        id: `${exercise.id}-set-${index + 1}`,
        templateExerciseId: exercise.id,
        durationMinutes: exercise.trackingMode === 'duration'
          ? exercise.targetDurationMinutes ?? 20
          : null,
        load: exercise.currentLoad,
        reps: exercise.targetReps,
        setNumber: index + 1,
        setType: 'normal' as const,
      })),
    ),
  ];

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
    exerciseLibrary: mergeExerciseLibrary(candidate.exerciseLibrary, seed.exerciseLibrary),
    workoutTemplates: nextWorkoutTemplates,
    templateExercises: [...seed.templateExercises, ...customTemplateExercises],
    templateExerciseSets:
      customTemplateExerciseSets.length > 0
        ? [
            ...seed.templateExerciseSets,
            ...customTemplateExerciseSets.filter((set) => {
              const owningTemplateExercise = customTemplateExercises.find(
                (exercise) => exercise.id === set.templateExerciseId,
              );
              return Boolean(owningTemplateExercise);
            }),
          ]
        : fallbackTemplateExerciseSets,
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
