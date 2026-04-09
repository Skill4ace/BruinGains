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
  LocalAppData,
  MealLog,
  MealLogPeriod,
  MealPeriod,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutTemplate,
} from '@/types/app-data';

type AppDataContextValue = {
  isHydrated: boolean;
  state: LocalAppData;
  addQuickMealLog: (period: MealLogPeriod) => void;
  createWorkoutTemplate: () => void;
  finishWorkoutSession: (sessionId: string) => void;
  logSet: (sessionExerciseId: string) => void;
  setPreferredDiningPeriod: (period: MealPeriod) => void;
  startEmptyWorkout: () => string;
  startWorkoutFromTemplate: (templateId: string) => string;
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
      order: exercise.order,
    }));
}

function getNextActiveExerciseId(
  exercises: WorkoutSessionExercise[],
  workoutSets: LocalAppData['workoutSets'],
  currentExerciseId: string,
) {
  const sortedExercises = exercises.sort((left, right) => left.order - right.order);
  const currentIndex = sortedExercises.findIndex((exercise) => exercise.id === currentExerciseId);

  for (let index = Math.max(currentIndex, 0); index < sortedExercises.length; index += 1) {
    const exercise = sortedExercises[index];
    const completedSets = workoutSets.filter(
      (set) => set.sessionExerciseId === exercise.id,
    ).length;

    if (completedSets < exercise.targetSets) {
      return exercise.id;
    }
  }

  return null;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LocalAppData | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      const nextState = await loadLocalAppData();

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
            id: createId('meal'),
            period,
            loggedAt: new Date().toISOString(),
            ...preset,
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
      const nextSession: WorkoutSession = {
        id: sessionId,
        title: template?.name ?? 'Workout',
        templateId,
        startedAt: new Date().toISOString(),
        endedAt: null,
        activeExerciseId: sessionExercises[0]?.id ?? null,
      };

      return {
        ...currentState,
        workoutSessions: [...currentState.workoutSessions, nextSession],
        workoutSessionExercises: [
          ...currentState.workoutSessionExercises,
          ...sessionExercises,
        ],
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
            title: 'Open Session',
            templateId: null,
            startedAt: new Date().toISOString(),
            endedAt: null,
            activeExerciseId: null,
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

      const sessionExercises = currentState.workoutSessionExercises.filter(
        (exercise) => exercise.sessionId === sessionExercise.sessionId,
      );
      const nextWorkoutSets = [
        ...currentState.workoutSets,
        {
          id: createId('set'),
          sessionId: sessionExercise.sessionId,
          sessionExerciseId,
          load: sessionExercise.currentLoad,
          reps: sessionExercise.targetReps,
          loggedAt: new Date().toISOString(),
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

  return (
    <AppDataContext.Provider
      value={{
        isHydrated: true,
        state,
        addQuickMealLog,
        createWorkoutTemplate,
        finishWorkoutSession,
        logSet,
        setPreferredDiningPeriod,
        startEmptyWorkout,
        startWorkoutFromTemplate,
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
