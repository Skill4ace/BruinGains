import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { loadLocalAppData, saveLocalAppData } from '@/data/local/storage';
import type {
  CreateCustomMealLogInput,
  CreateDiningMealLogInput,
  LocalAppData,
  MealLog,
  MealLogPeriod,
  MealPeriod,
  UpdateMealLogInput,
  WorkoutExerciseDraft,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSet,
  WorkoutTemplate,
} from '@/types/app-data';

type AppDataContextValue = {
  isHydrated: boolean;
  addWorkoutExercise: (sessionId: string, draft: WorkoutExerciseDraft) => void;
  state: LocalAppData;
  addQuickMealLog: (period: MealLogPeriod) => void;
  addCustomMealLog: (input: CreateCustomMealLogInput) => void;
  addDiningMealLog: (input: CreateDiningMealLogInput) => void;
  cancelWorkoutSession: (sessionId: string) => void;
  clearTodayMealLogs: () => void;
  createWorkoutTemplate: () => void;
  deleteMealLog: (mealLogId: string) => void;
  finishWorkoutSession: (sessionId: string) => void;
  addWorkoutSetRow: (sessionExerciseId: string) => void;
  logSet: (sessionExerciseId: string) => void;
  removeWorkoutSetRow: (
    sessionExerciseId: string,
    workoutSetId: string | null,
    setNumber: number,
  ) => void;
  removeWorkoutExercise: (sessionExerciseId: string) => void;
  replaceWorkoutExercise: (sessionExerciseId: string, draft: WorkoutExerciseDraft) => void;
  setPreferredDiningPeriod: (period: MealPeriod) => void;
  startEmptyWorkout: () => string;
  startWorkoutFromTemplate: (templateId: string) => string;
  toggleWorkoutSetCompletion: (sessionExerciseId: string, setNumber: number) => void;
  updateWorkoutSessionTitle: (sessionId: string, title: string) => void;
  updateWorkoutSetType: (
    sessionExerciseId: string,
    setNumber: number,
    setType: WorkoutSet['setType'],
  ) => void;
  updateMealLog: (input: UpdateMealLogInput) => void;
  updateWorkoutSetValue: (
    sessionExerciseId: string,
    setNumber: number,
    field: 'durationMinutes' | 'load' | 'reps',
    value: number,
  ) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

const QUICK_MEAL_PRESETS: Record<
  MealLogPeriod,
  Omit<MealLog, 'id' | 'loggedAt' | 'period'>
> = {
  breakfast: {
    title: 'Quick breakfast',
    calories: 360,
    protein: 24,
    carbs: 38,
    fats: 12,
    source: 'manual',
  },
  lunch: {
    title: 'Quick lunch',
    calories: 540,
    protein: 36,
    carbs: 58,
    fats: 18,
    source: 'manual',
  },
  dinner: {
    title: 'Quick dinner',
    calories: 610,
    protein: 42,
    carbs: 56,
    fats: 20,
    source: 'manual',
  },
  lateNight: {
    title: 'Late-night add',
    calories: 260,
    protein: 18,
    carbs: 24,
    fats: 10,
    source: 'manual',
  },
  snack: {
    title: 'Quick snack',
    calories: 210,
    protein: 20,
    carbs: 16,
    fats: 8,
    source: 'manual',
  },
};

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createMealLogId() {
  return createId('meal');
}

function createPlaceholderWorkoutSet(
  sessionExercise: WorkoutSessionExercise,
  setNumber: number,
): WorkoutSet {
  const trackingMode = sessionExercise.trackingMode ?? 'strength';

  return {
    id: createId('set'),
    sessionId: sessionExercise.sessionId,
    sessionExerciseId: sessionExercise.id,
    durationMinutes:
      trackingMode === 'duration' ? sessionExercise.targetDurationMinutes ?? 20 : null,
    load: trackingMode === 'duration' ? 0 : sessionExercise.currentLoad,
    reps: trackingMode === 'duration' ? 0 : sessionExercise.targetReps,
    completed: false,
    loggedAt: new Date().toISOString(),
    setNumber,
    setType: 'normal',
  };
}

function buildSessionExercisesFromTemplate(
  state: LocalAppData,
  templateId: string,
  sessionId: string,
): WorkoutSessionExercise[] {
  return state.templateExercises
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
      targetDurationMinutes: null,
      trackingMode: 'strength',
      order: exercise.order,
    }));
}

function normalizeExerciseName(value: string) {
  return value.trim().toLowerCase();
}

function normalizeWorkoutSet(
  workoutSet: WorkoutSet,
  fallbackSetNumber: number,
) {
  return {
    ...workoutSet,
    completed: workoutSet.completed ?? true,
    setNumber: workoutSet.setNumber ?? fallbackSetNumber,
  };
}

function getExerciseWorkoutSets(
  workoutSets: WorkoutSet[],
  sessionExerciseId: string,
) {
  return workoutSets
    .filter((set) => set.sessionExerciseId === sessionExerciseId)
    .sort((left, right) => {
      const leftSetNumber = left.setNumber ?? Number.MAX_SAFE_INTEGER;
      const rightSetNumber = right.setNumber ?? Number.MAX_SAFE_INTEGER;

      if (leftSetNumber !== rightSetNumber) {
        return leftSetNumber - rightSetNumber;
      }

      return left.loggedAt.localeCompare(right.loggedAt);
    })
    .map((set, index) => normalizeWorkoutSet(set, index + 1));
}

function buildInitialWorkoutSetsForExercises(
  sessionExercises: WorkoutSessionExercise[],
) {
  return sessionExercises.flatMap((exercise) =>
    Array.from({ length: exercise.targetSets }, (_, index) =>
      createPlaceholderWorkoutSet(exercise, index + 1),
    ),
  );
}

function getCompletedSetCount(
  workoutSets: WorkoutSet[],
  sessionExerciseId: string,
) {
  return getExerciseWorkoutSets(workoutSets, sessionExerciseId).filter(
    (set) => set.completed,
  ).length;
}

function buildExerciseDefaults(
  state: LocalAppData,
  exerciseName: string,
  trackingMode: WorkoutExerciseDraft['trackingMode'],
) {
  const normalizedExerciseName = normalizeExerciseName(exerciseName);
  const latestHistoricalSet = [...state.workoutSets]
    .filter((set) => set.completed ?? true)
    .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt))
    .find((set) => {
      const sessionExercise = state.workoutSessionExercises.find(
        (exercise) => exercise.id === set.sessionExerciseId,
      );

      return (
        sessionExercise &&
        normalizeExerciseName(sessionExercise.name) === normalizedExerciseName
      );
    });

  if (!latestHistoricalSet) {
    return {
      currentLoad: 45,
      previousDurationMinutes: 20,
      previousLoadLabel: 'No previous workout',
      targetReps: 8,
    };
  }

  return {
    currentLoad: latestHistoricalSet.load,
    previousDurationMinutes: latestHistoricalSet.durationMinutes ?? 20,
    previousLoadLabel:
      trackingMode === 'duration'
        ? `${latestHistoricalSet.durationMinutes ?? 20} min`
        : `${latestHistoricalSet.load} lb × ${latestHistoricalSet.reps}`,
    targetReps: latestHistoricalSet.reps,
  };
}

function createSessionExercise(
  state: LocalAppData,
  sessionId: string,
  draft: WorkoutExerciseDraft,
  order: number,
  overrides?: Partial<WorkoutSessionExercise>,
): WorkoutSessionExercise {
  const trackingMode = draft.trackingMode;
  const defaults = buildExerciseDefaults(state, draft.name, trackingMode);

  return {
    id: createId('session-exercise'),
    sessionId,
    templateExerciseId: null,
    name: draft.name.trim(),
    targetSets: draft.targetSets,
    repRange:
      trackingMode === 'duration'
        ? `${draft.targetDurationMinutes ?? 20} min`
        : draft.repRange ?? '8-10',
    previousLoadLabel: defaults.previousLoadLabel,
    currentLoad: trackingMode === 'duration' ? 0 : draft.currentLoad ?? defaults.currentLoad,
    targetReps: trackingMode === 'duration' ? 0 : draft.targetReps ?? defaults.targetReps,
    targetDurationMinutes:
      trackingMode === 'duration' ? draft.targetDurationMinutes ?? 20 : null,
    trackingMode,
    order,
    ...overrides,
  };
}

function upsertWorkoutSet(
  workoutSets: WorkoutSet[],
  nextSet: WorkoutSet,
) {
  const existingIndex = workoutSets.findIndex((set) => set.id === nextSet.id);

  if (existingIndex === -1) {
    return [...workoutSets, nextSet];
  }

  return workoutSets.map((set, index) =>
    index === existingIndex ? nextSet : set,
  );
}

function getNextActiveExerciseId(
  exercises: WorkoutSessionExercise[],
  workoutSets: LocalAppData['workoutSets'],
  currentExerciseId: string | null,
) {
  const sortedExercises = [...exercises].sort((left, right) => left.order - right.order);
  const currentIndex = currentExerciseId
    ? sortedExercises.findIndex((exercise) => exercise.id === currentExerciseId)
    : -1;

  for (let index = Math.max(currentIndex, 0); index < sortedExercises.length; index += 1) {
    const exercise = sortedExercises[index];
    const completedSets = getCompletedSetCount(workoutSets, exercise.id);

    if (completedSets < exercise.targetSets) {
      return exercise.id;
    }
  }

  for (let index = 0; index < Math.max(currentIndex, 0); index += 1) {
    const exercise = sortedExercises[index];
    const completedSets = getCompletedSetCount(workoutSets, exercise.id);

    if (completedSets < exercise.targetSets) {
      return exercise.id;
    }
  }

  return null;
}

function isMealLoggedToday(loggedAt: string) {
  const loggedDate = new Date(loggedAt);
  const today = new Date();

  return (
    loggedDate.getFullYear() === today.getFullYear() &&
    loggedDate.getMonth() === today.getMonth() &&
    loggedDate.getDate() === today.getDate()
  );
}

function ensureOpenWorkoutSetRows(state: LocalAppData) {
  const activeSessionIds = new Set(
    state.workoutSessions
      .filter((session) => !session.endedAt)
      .map((session) => session.id),
  );

  if (!activeSessionIds.size) {
    return state;
  }

  const nextWorkoutSets = [...state.workoutSets];

  state.workoutSessionExercises
    .filter((exercise) => activeSessionIds.has(exercise.sessionId))
    .forEach((exercise) => {
      const existingSetNumbers = new Set(
        nextWorkoutSets
          .filter((set) => set.sessionExerciseId === exercise.id)
          .map((set) => set.setNumber),
      );

      for (let setNumber = 1; setNumber <= exercise.targetSets; setNumber += 1) {
        if (!existingSetNumbers.has(setNumber)) {
          nextWorkoutSets.push(createPlaceholderWorkoutSet(exercise, setNumber));
        }
      }
    });

  return {
    ...state,
    workoutSets: nextWorkoutSets,
  };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LocalAppData | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      const nextState = ensureOpenWorkoutSetRows(await loadLocalAppData());

      if (!isMounted) {
        return;
      }

      startTransition(() => {
        setState(nextState);
      });
    }

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state) {
      return;
    }

    void saveLocalAppData(state);
  }, [state]);

  if (!state) {
    return null;
  }

  function addQuickMealLog(period: MealLogPeriod) {
    const preset = QUICK_MEAL_PRESETS[period];

    setState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      return {
        ...currentState,
        mealLogs: [
          ...currentState.mealLogs,
          {
            id: createMealLogId(),
            period,
            loggedAt: new Date().toISOString(),
            ...preset,
          },
        ],
      };
    });
  }

  function addCustomMealLog(input: CreateCustomMealLogInput) {
    setState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      return {
        ...currentState,
        mealLogs: [
          ...currentState.mealLogs,
          {
            id: createMealLogId(),
            title: input.title.trim(),
            period: input.period,
            loggedAt: new Date().toISOString(),
            calories: input.calories,
            protein: input.protein,
            carbs: input.carbs,
            fats: input.fats,
            source: 'manual',
          },
        ],
      };
    });
  }

  function addDiningMealLog(input: CreateDiningMealLogInput) {
    const servings = Math.max(0.5, Math.round(input.servings * 2) / 2);
    const caloriesPerServing = input.nutritionOverride?.calories ?? input.item.calories ?? 0;
    const proteinPerServing = input.nutritionOverride?.proteinG ?? input.item.proteinG ?? 0;
    const carbsPerServing = input.nutritionOverride?.carbsG ?? input.item.carbsG ?? 0;
    const fatsPerServing = input.nutritionOverride?.fatsG ?? input.item.fatsG ?? 0;

    setState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      return {
        ...currentState,
        mealLogs: [
          ...currentState.mealLogs,
          {
            id: createMealLogId(),
            title: input.titleOverride?.trim() || input.item.itemName,
            period: input.item.mealPeriod,
            loggedAt: new Date().toISOString(),
            calories: Math.round(caloriesPerServing * servings),
            protein: Math.round(proteinPerServing * servings),
            carbs: Math.round(carbsPerServing * servings),
            fats: Math.round(fatsPerServing * servings),
            source: 'dining',
            hallId: input.item.hallId,
            hallName: input.item.hallName,
            recipeId: input.item.recipeId ?? undefined,
            servingSize: input.item.servingSize ?? undefined,
            servings,
          },
        ],
      };
    });
  }

  function createWorkoutTemplate() {
    setState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      const customTemplateCount = currentState.workoutTemplates.filter((template) =>
        template.name.startsWith('Custom'),
      ).length;
      const now = new Date().toISOString();
      const newTemplate: WorkoutTemplate = {
        id: createId('template'),
        name: `Custom ${customTemplateCount + 1}`,
        focus: 'Custom split',
        createdAt: now,
        updatedAt: now,
      };

      return {
        ...currentState,
        workoutTemplates: [...currentState.workoutTemplates, newTemplate],
      };
    });
  }

  function setPreferredDiningPeriod(period: MealPeriod) {
    setState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      return {
        ...currentState,
        userPreferences: {
          ...currentState.userPreferences,
          preferredDiningPeriod: period,
        },
      };
    });
  }

  function clearTodayMealLogs() {
    setState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      return {
        ...currentState,
        mealLogs: currentState.mealLogs.filter((mealLog) => !isMealLoggedToday(mealLog.loggedAt)),
      };
    });
  }

  function updateMealLog(input: UpdateMealLogInput) {
    setState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      return {
        ...currentState,
        mealLogs: currentState.mealLogs.map((mealLog) =>
          mealLog.id === input.mealLogId
            ? {
                ...mealLog,
                title: input.title.trim(),
                period: input.period,
                calories: input.calories,
                protein: input.protein,
                carbs: input.carbs,
                fats: input.fats,
              }
            : mealLog,
        ),
      };
    });
  }

  function deleteMealLog(mealLogId: string) {
    setState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      return {
        ...currentState,
        mealLogs: currentState.mealLogs.filter((mealLog) => mealLog.id !== mealLogId),
      };
    });
  }

  function startWorkoutFromTemplate(templateId: string) {
    const sessionId = createId('session');

    setState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      const template = currentState.workoutTemplates.find(
        (candidate) => candidate.id === templateId,
      );
      const sessionExercises = buildSessionExercisesFromTemplate(
        currentState,
        templateId,
        sessionId,
      );
      const sessionWorkoutSets = buildInitialWorkoutSetsForExercises(sessionExercises);
      const nextSession: WorkoutSession = {
        id: sessionId,
        title: template?.name ?? 'Workout',
        templateId,
        startedAt: new Date().toISOString(),
        endedAt: null,
        activeExerciseId: sessionExercises[0]?.id ?? null,
        restDurationSeconds: null,
        restStartedAt: null,
      };

      return {
        ...currentState,
        workoutSessions: [...currentState.workoutSessions, nextSession],
        workoutSessionExercises: [
          ...currentState.workoutSessionExercises,
          ...sessionExercises,
        ],
        workoutSets: [...currentState.workoutSets, ...sessionWorkoutSets],
        userPreferences: {
          ...currentState.userPreferences,
          activeWorkoutSessionId: sessionId,
        },
      };
    });

    return sessionId;
  }

  function startEmptyWorkout() {
    const sessionId = createId('session');

    setState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      return {
        ...currentState,
        workoutSessions: [
          ...currentState.workoutSessions,
          {
            id: sessionId,
            title: 'Workout',
            templateId: null,
            startedAt: new Date().toISOString(),
            endedAt: null,
            activeExerciseId: null,
            restDurationSeconds: null,
            restStartedAt: null,
          },
        ],
        userPreferences: {
          ...currentState.userPreferences,
          activeWorkoutSessionId: sessionId,
        },
      };
    });

    return sessionId;
  }

  function logSet(sessionExerciseId: string) {
    setState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      const sessionExercise = currentState.workoutSessionExercises.find(
        (exercise) => exercise.id === sessionExerciseId,
      );

      if (!sessionExercise) {
        return currentState;
      }

      const trackingMode = sessionExercise.trackingMode ?? 'strength';
      const existingSets = getExerciseWorkoutSets(
        currentState.workoutSets,
        sessionExerciseId,
      );
      const nextSetNumber =
        existingSets.find((set) => !set.completed)?.setNumber ??
        existingSets.length + 1;
      const sessionExercises = currentState.workoutSessionExercises.filter(
        (exercise) => exercise.sessionId === sessionExercise.sessionId,
      );
      const nextWorkoutSets: WorkoutSet[] = [
        ...currentState.workoutSets,
        {
          id: createId('set'),
          sessionId: sessionExercise.sessionId,
          sessionExerciseId,
          durationMinutes:
            trackingMode === 'duration' ? sessionExercise.targetDurationMinutes ?? 20 : null,
          load: trackingMode === 'duration' ? 0 : sessionExercise.currentLoad,
          reps: trackingMode === 'duration' ? 0 : sessionExercise.targetReps,
          completed: true,
          loggedAt: new Date().toISOString(),
          setType: 'normal' as const,
          setNumber: nextSetNumber,
        },
      ];
      const nextActiveExerciseId = getNextActiveExerciseId(
        [...sessionExercises],
        nextWorkoutSets,
        sessionExerciseId,
      );

      return {
        ...currentState,
        workoutSets: nextWorkoutSets,
        workoutSessions: currentState.workoutSessions.map((session) =>
          session.id === sessionExercise.sessionId
            ? {
                ...session,
                activeExerciseId: nextActiveExerciseId,
                restDurationSeconds: 90,
                restStartedAt: new Date().toISOString(),
              }
            : session,
        ),
      };
    });
  }

  function addWorkoutExercise(sessionId: string, draft: WorkoutExerciseDraft) {
    setState((currentState) => {
      if (!currentState || !draft.name.trim()) {
        return currentState;
      }

      const sessionExercises = currentState.workoutSessionExercises
        .filter((exercise) => exercise.sessionId === sessionId)
        .sort((left, right) => left.order - right.order);
      const nextExercise = createSessionExercise(
        currentState,
        sessionId,
        draft,
        sessionExercises.length,
      );
      const nextExerciseSets = buildInitialWorkoutSetsForExercises([nextExercise]);
      const hasExerciseLibraryEntry = currentState.exerciseLibrary.some(
        (exercise) => normalizeExerciseName(exercise.name) === normalizeExerciseName(draft.name),
      );

      return {
        ...currentState,
        exerciseLibrary: hasExerciseLibraryEntry
          ? currentState.exerciseLibrary
          : [
              ...currentState.exerciseLibrary,
              {
                aliases: [],
                bodyPart: null,
                category: null,
                description: null,
                difficulty: null,
                equipment: null,
                force: null,
                imageAssetId: null,
                imageUrls: [],
                id: createId('exercise'),
                instructions: [],
                level: null,
                mechanic: null,
                name: draft.name.trim(),
                focus: draft.trackingMode === 'duration' ? 'Conditioning' : 'Custom',
                primaryMuscles: [],
                secondaryMuscles: [],
                source: 'custom',
                target: null,
              },
            ],
        workoutSessionExercises: [
          ...currentState.workoutSessionExercises,
          nextExercise,
        ],
        workoutSets: [...currentState.workoutSets, ...nextExerciseSets],
        workoutSessions: currentState.workoutSessions.map((session) =>
          session.id === sessionId && !session.activeExerciseId
            ? { ...session, activeExerciseId: nextExercise.id }
            : session,
        ),
      };
    });
  }

  function replaceWorkoutExercise(
    sessionExerciseId: string,
    draft: WorkoutExerciseDraft,
  ) {
    setState((currentState) => {
      if (!currentState || !draft.name.trim()) {
        return currentState;
      }

      const targetExercise = currentState.workoutSessionExercises.find(
        (exercise) => exercise.id === sessionExerciseId,
      );

      if (!targetExercise) {
        return currentState;
      }

      const replacementExercise = createSessionExercise(
        currentState,
        targetExercise.sessionId,
        draft,
        targetExercise.order,
        {
          id: targetExercise.id,
        },
      );
      const replacementSets = buildInitialWorkoutSetsForExercises([replacementExercise]);
      const hasExerciseLibraryEntry = currentState.exerciseLibrary.some(
        (exercise) => normalizeExerciseName(exercise.name) === normalizeExerciseName(draft.name),
      );

      return {
        ...currentState,
        exerciseLibrary: hasExerciseLibraryEntry
          ? currentState.exerciseLibrary
          : [
              ...currentState.exerciseLibrary,
              {
                aliases: [],
                bodyPart: null,
                category: null,
                description: null,
                difficulty: null,
                equipment: null,
                force: null,
                imageAssetId: null,
                imageUrls: [],
                id: createId('exercise'),
                instructions: [],
                level: null,
                mechanic: null,
                name: draft.name.trim(),
                focus: draft.trackingMode === 'duration' ? 'Conditioning' : 'Custom',
                primaryMuscles: [],
                secondaryMuscles: [],
                source: 'custom',
                target: null,
              },
            ],
        workoutSessionExercises: currentState.workoutSessionExercises.map((exercise) =>
          exercise.id === sessionExerciseId ? replacementExercise : exercise,
        ),
        workoutSets: [
          ...currentState.workoutSets.filter(
            (set) => set.sessionExerciseId !== sessionExerciseId,
          ),
          ...replacementSets,
        ],
      };
    });
  }

  function addWorkoutSetRow(sessionExerciseId: string) {
    setState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      const sessionExercise = currentState.workoutSessionExercises.find(
        (exercise) => exercise.id === sessionExerciseId,
      );

      if (!sessionExercise) {
        return currentState;
      }
      const nextSetNumber = sessionExercise.targetSets + 1;

      return {
        ...currentState,
        workoutSets: [
          ...currentState.workoutSets,
          createPlaceholderWorkoutSet(sessionExercise, nextSetNumber),
        ],
        workoutSessionExercises: currentState.workoutSessionExercises.map((exercise) =>
          exercise.id === sessionExerciseId
            ? { ...exercise, targetSets: exercise.targetSets + 1 }
            : exercise,
        ),
      };
    });
  }

  function removeWorkoutExercise(sessionExerciseId: string) {
    setState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      const targetExercise = currentState.workoutSessionExercises.find(
        (exercise) => exercise.id === sessionExerciseId,
      );

      if (!targetExercise) {
        return currentState;
      }

      const remainingExercises = currentState.workoutSessionExercises
        .filter((exercise) => exercise.id !== sessionExerciseId)
        .map((exercise) =>
          exercise.sessionId === targetExercise.sessionId && exercise.order > targetExercise.order
            ? { ...exercise, order: exercise.order - 1 }
            : exercise,
        );
      const sessionExercises = remainingExercises.filter(
        (exercise) => exercise.sessionId === targetExercise.sessionId,
      );
      const nextWorkoutSets = currentState.workoutSets.filter(
        (set) => set.sessionExerciseId !== sessionExerciseId,
      );
      const nextActiveExerciseId = getNextActiveExerciseId(
        sessionExercises,
        nextWorkoutSets,
        targetExercise.id,
      );

      return {
        ...currentState,
        workoutSessionExercises: remainingExercises,
        workoutSets: nextWorkoutSets,
        workoutSessions: currentState.workoutSessions.map((session) =>
          session.id === targetExercise.sessionId
            ? { ...session, activeExerciseId: nextActiveExerciseId }
            : session,
        ),
      };
    });
  }

  function removeWorkoutSetRow(
    sessionExerciseId: string,
    workoutSetId: string | null,
    setNumber: number,
  ) {
    setState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      const sessionExercise = currentState.workoutSessionExercises.find(
        (exercise) => exercise.id === sessionExerciseId,
      );

      if (!sessionExercise) {
        return currentState;
      }

      const normalizedSetNumber = Math.max(1, Math.round(setNumber));
      const nextWorkoutSets: WorkoutSet[] = currentState.workoutSets
        .filter(
          (set) =>
            !(
              set.sessionExerciseId === sessionExerciseId &&
              (
                (workoutSetId ? set.id === workoutSetId : false) ||
                (!workoutSetId &&
                  (set.setNumber ?? Number.MAX_SAFE_INTEGER) === normalizedSetNumber)
              )
            ),
        )
        .map((set) =>
          set.sessionExerciseId === sessionExerciseId &&
          (set.setNumber ?? Number.MAX_SAFE_INTEGER) > normalizedSetNumber
            ? { ...set, setNumber: (set.setNumber ?? normalizedSetNumber) - 1 }
            : set,
        );

      return {
        ...currentState,
        workoutSets: nextWorkoutSets,
        workoutSessionExercises: currentState.workoutSessionExercises.map((exercise) =>
          exercise.id === sessionExerciseId
            ? { ...exercise, targetSets: Math.max(1, exercise.targetSets - 1) }
            : exercise,
        ),
      };
    });
  }

  function updateWorkoutSetValue(
    sessionExerciseId: string,
    setNumber: number,
    field: 'durationMinutes' | 'load' | 'reps',
    value: number,
  ) {
    setState((currentState) => {
      if (!currentState || !Number.isFinite(value) || value < 0) {
        return currentState;
      }

      const sessionExercise = currentState.workoutSessionExercises.find(
        (exercise) => exercise.id === sessionExerciseId,
      );

      if (!sessionExercise) {
        return currentState;
      }

      const normalizedSetNumber = Math.max(1, Math.round(setNumber));
      const existingSet = getExerciseWorkoutSets(
        currentState.workoutSets,
        sessionExerciseId,
      ).find((set) => set.setNumber === normalizedSetNumber);
      const nextWorkoutSet: WorkoutSet = existingSet
        ? {
            ...existingSet,
            [field]: value,
          }
        : {
            id: createId('set'),
            sessionId: sessionExercise.sessionId,
            sessionExerciseId,
            durationMinutes:
              field === 'durationMinutes'
                ? value
                : sessionExercise.targetDurationMinutes ?? null,
            load: field === 'load' ? value : sessionExercise.currentLoad,
            reps: field === 'reps' ? value : sessionExercise.targetReps,
            completed: false,
            loggedAt: new Date().toISOString(),
            setType: 'normal',
            setNumber: normalizedSetNumber,
          };

      return {
        ...currentState,
        workoutSets: upsertWorkoutSet(currentState.workoutSets, nextWorkoutSet),
        workoutSessionExercises: currentState.workoutSessionExercises.map((exercise) =>
          exercise.id === sessionExerciseId
            ? {
                ...exercise,
                currentLoad: field === 'load' ? value : exercise.currentLoad,
                targetDurationMinutes:
                  field === 'durationMinutes'
                    ? value
                    : exercise.targetDurationMinutes ?? null,
                targetReps: field === 'reps' ? value : exercise.targetReps,
              }
            : exercise,
        ),
      };
    });
  }

  function toggleWorkoutSetCompletion(sessionExerciseId: string, setNumber: number) {
    setState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      const sessionExercise = currentState.workoutSessionExercises.find(
        (exercise) => exercise.id === sessionExerciseId,
      );

      if (!sessionExercise) {
        return currentState;
      }

      const normalizedSetNumber = Math.max(1, Math.round(setNumber));
      const existingSet = getExerciseWorkoutSets(
        currentState.workoutSets,
        sessionExerciseId,
      ).find((set) => set.setNumber === normalizedSetNumber);
      const nextCompleted = !(existingSet?.completed ?? false);
      const nextWorkoutSet: WorkoutSet = existingSet
        ? {
            ...existingSet,
            completed: nextCompleted,
            loggedAt: new Date().toISOString(),
          }
        : {
            id: createId('set'),
            sessionId: sessionExercise.sessionId,
            sessionExerciseId,
            durationMinutes: sessionExercise.targetDurationMinutes ?? null,
            load: sessionExercise.currentLoad,
            reps: sessionExercise.targetReps,
            completed: nextCompleted,
            loggedAt: new Date().toISOString(),
            setType: 'normal',
            setNumber: normalizedSetNumber,
          };
      const nextWorkoutSets = upsertWorkoutSet(currentState.workoutSets, nextWorkoutSet);
      const sessionExercises = currentState.workoutSessionExercises.filter(
        (exercise) => exercise.sessionId === sessionExercise.sessionId,
      );
      const nextActiveExerciseId = nextCompleted
        ? getNextActiveExerciseId(sessionExercises, nextWorkoutSets, sessionExerciseId)
        : sessionExerciseId;

      return {
        ...currentState,
        workoutSets: nextWorkoutSets,
        workoutSessions: currentState.workoutSessions.map((session) =>
          session.id === sessionExercise.sessionId
            ? {
                ...session,
                activeExerciseId: nextActiveExerciseId,
                restDurationSeconds: nextCompleted ? 90 : session.restDurationSeconds ?? null,
                restStartedAt: nextCompleted ? new Date().toISOString() : null,
              }
            : session,
        ),
      };
    });
  }

  function updateWorkoutSetType(
    sessionExerciseId: string,
    setNumber: number,
    setType: WorkoutSet['setType'],
  ) {
    setState((currentState) => {
      if (!currentState || !setType) {
        return currentState;
      }

      const sessionExercise = currentState.workoutSessionExercises.find(
        (exercise) => exercise.id === sessionExerciseId,
      );

      if (!sessionExercise) {
        return currentState;
      }

      const normalizedSetNumber = Math.max(1, Math.round(setNumber));
      const existingSet = getExerciseWorkoutSets(
        currentState.workoutSets,
        sessionExerciseId,
      ).find((set) => set.setNumber === normalizedSetNumber);
      const nextWorkoutSet: WorkoutSet = existingSet
        ? {
            ...existingSet,
            setType,
          }
        : {
            id: createId('set'),
            sessionId: sessionExercise.sessionId,
            sessionExerciseId,
            durationMinutes: sessionExercise.targetDurationMinutes ?? null,
            load: sessionExercise.currentLoad,
            reps: sessionExercise.targetReps,
            completed: false,
            loggedAt: new Date().toISOString(),
            setNumber: normalizedSetNumber,
            setType,
          };

      return {
        ...currentState,
        workoutSets: upsertWorkoutSet(currentState.workoutSets, nextWorkoutSet),
      };
    });
  }

  function updateWorkoutSessionTitle(sessionId: string, title: string) {
    setState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      const trimmedTitle = title.trim();

      return {
        ...currentState,
        workoutSessions: currentState.workoutSessions.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                title: trimmedTitle || 'Workout',
              }
            : session,
        ),
      };
    });
  }

  function finishWorkoutSession(sessionId: string) {
    setState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      return {
        ...currentState,
        workoutSessions: currentState.workoutSessions.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                endedAt: session.endedAt ?? new Date().toISOString(),
                activeExerciseId: null,
                restDurationSeconds: null,
                restStartedAt: null,
              }
            : session,
        ),
        userPreferences: {
          ...currentState.userPreferences,
          activeWorkoutSessionId:
            currentState.userPreferences.activeWorkoutSessionId === sessionId
              ? null
              : currentState.userPreferences.activeWorkoutSessionId,
        },
      };
    });
  }

  function cancelWorkoutSession(sessionId: string) {
    setState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      const remainingSessionExercises = currentState.workoutSessionExercises.filter(
        (exercise) => exercise.sessionId !== sessionId,
      );

      return {
        ...currentState,
        workoutSessions: currentState.workoutSessions.filter(
          (session) => session.id !== sessionId,
        ),
        workoutSessionExercises: remainingSessionExercises,
        workoutSets: currentState.workoutSets.filter((set) => set.sessionId !== sessionId),
        userPreferences: {
          ...currentState.userPreferences,
          activeWorkoutSessionId:
            currentState.userPreferences.activeWorkoutSessionId === sessionId
              ? null
              : currentState.userPreferences.activeWorkoutSessionId,
        },
      };
    });
  }

  return (
    <AppDataContext.Provider
      value={{
        isHydrated: true,
        state,
        addWorkoutExercise,
        addWorkoutSetRow,
        addQuickMealLog,
        addCustomMealLog,
        addDiningMealLog,
        cancelWorkoutSession,
        clearTodayMealLogs,
        createWorkoutTemplate,
        deleteMealLog,
        finishWorkoutSession,
        logSet,
        removeWorkoutSetRow,
        removeWorkoutExercise,
        replaceWorkoutExercise,
        setPreferredDiningPeriod,
        startEmptyWorkout,
        startWorkoutFromTemplate,
        toggleWorkoutSetCompletion,
        updateMealLog,
        updateWorkoutSessionTitle,
        updateWorkoutSetType,
        updateWorkoutSetValue,
      }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }

  return context;
}
