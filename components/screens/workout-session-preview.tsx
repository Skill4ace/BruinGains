import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  formatWorkoutTimerLabel,
  getActiveWorkoutSessionView,
} from '@/data/local/selectors';
import {
  getExerciseLibraryImageSource,
  inferExerciseTrackingMode,
  searchExerciseLibraryEntry,
} from '@/data/local/exercise-library';
import {
  formatDurationInput,
  formatDurationMinutes,
  parseDurationMinutesInput,
} from '@/lib/workout-duration';
import { useAppData } from '@/providers/app-data-provider';
import { ActionButton } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';
import { SurfaceCard } from '@/components/ui/surface-card';
import { AppColors, Layout, Radii, Shadows, Spacing } from '@/constants/theme';
import type {
  ActiveWorkoutExerciseView,
  ActiveWorkoutSetView,
  ExerciseLibraryEntry,
  WorkoutExerciseDraft,
  WorkoutSetType,
  WorkoutTrackingMode,
} from '@/types/app-data';

type PickerState = {
  mode: 'add' | 'replace';
  targetExerciseId: string | null;
};

type ExerciseFilterGroup =
  | 'all'
  | 'arms'
  | 'back'
  | 'cardio'
  | 'chest'
  | 'core'
  | 'legs'
  | 'other'
  | 'shoulders';

type ExerciseFilterType =
  | 'all'
  | 'barbell'
  | 'bodyweight'
  | 'cardio'
  | 'dumbbell'
  | 'machine';

type ExerciseComposerDraft = {
  durationMinutes: string;
  load: string;
  name: string;
  repRange: string;
  reps: string;
  trackingMode: WorkoutTrackingMode;
};

const DEFAULT_COMPOSER_DRAFT: ExerciseComposerDraft = {
  durationMinutes: '20:00',
  load: '45',
  name: '',
  repRange: '8-10',
  reps: '8',
  trackingMode: 'strength',
};

const SET_TYPE_OPTIONS: { label: string; shortLabel: string; tone: string; value: WorkoutSetType }[] = [
  { label: 'Regular', shortLabel: '', tone: AppColors.textMuted, value: 'normal' },
  { label: 'Warm-up', shortLabel: 'W', tone: '#D58C2F', value: 'warmup' },
  { label: 'Drop', shortLabel: 'D', tone: '#7B3AED', value: 'drop' },
  { label: 'Failure', shortLabel: 'F', tone: AppColors.danger, value: 'failure' },
];

const EXERCISE_FILTER_GROUPS: ExerciseFilterGroup[] = [
  'all',
  'core',
  'arms',
  'back',
  'chest',
  'legs',
  'shoulders',
  'other',
  'cardio',
];

const EXERCISE_FILTER_TYPES: ExerciseFilterType[] = [
  'all',
  'barbell',
  'dumbbell',
  'machine',
  'bodyweight',
  'cardio',
];

type WorkoutInputField = 'durationMinutes' | 'load' | 'reps';

type WorkoutInputTarget = {
  exercise: ActiveWorkoutExerciseView;
  fallbackValue: number;
  field: WorkoutInputField;
  fieldLabel: string;
  key: string;
  rowKey: string;
  setRow: ActiveWorkoutSetView;
  step: number;
  unitLabel: string;
};

const WORKOUT_INPUT_BOARD_DEFAULT_HEIGHT = 332;
const LOAD_STEP = 5;
const REPS_STEP = 1;
const DURATION_STEP_MINUTES = 15 / 60;

function getWorkoutInputKey(
  exerciseId: string,
  rowKey: string,
  field: WorkoutInputField,
) {
  return `${exerciseId}:${rowKey}:${field}`;
}

function sanitizeIntegerInput(value: string) {
  const digitsOnly = value.replace(/\D/g, '');

  if (!digitsOnly) {
    return '';
  }

  return String(Number.parseInt(digitsOnly, 10));
}

function sanitizeLoadInput(value: string) {
  const sanitized = value.replace(/[^0-9.]/g, '');

  if (!sanitized) {
    return '';
  }

  const includesDecimal = sanitized.includes('.');
  const [integerPartRaw, ...decimalParts] = sanitized.split('.');
  const integerPart = integerPartRaw ? String(Number.parseInt(integerPartRaw, 10)) : '0';
  const decimalPart = decimalParts.join('').slice(0, 2);

  if (!includesDecimal) {
    return integerPart;
  }

  if (!decimalPart && sanitized.endsWith('.')) {
    return `${integerPart}.`;
  }

  return `${integerPart}.${decimalPart}`;
}

function formatLoadValue(value: number) {
  const roundedValue = Math.round(value * 100) / 100;

  if (Number.isInteger(roundedValue)) {
    return String(roundedValue);
  }

  return roundedValue.toFixed(2).replace(/\.?0+$/, '');
}

function appendWorkoutInputValue(
  field: WorkoutInputField,
  currentValue: string,
  token: string,
  replaceExisting: boolean,
) {
  if (field === 'durationMinutes') {
    const currentDigits = replaceExisting ? '' : currentValue.replace(/\D/g, '');
    return formatDurationInput(`${currentDigits}${token}`);
  }

  if (field === 'load') {
    return sanitizeLoadInput(`${replaceExisting ? '' : currentValue}${token}`);
  }

  return sanitizeIntegerInput(`${replaceExisting ? '' : currentValue}${token}`);
}

function removeWorkoutInputCharacter(
  field: WorkoutInputField,
  currentValue: string,
  replaceExisting: boolean,
) {
  if (replaceExisting) {
    return '';
  }

  if (field === 'durationMinutes') {
    const nextDigits = currentValue.replace(/\D/g, '').slice(0, -1);
    return formatDurationInput(nextDigits);
  }

  if (field === 'load') {
    return sanitizeLoadInput(currentValue.slice(0, -1));
  }

  return sanitizeIntegerInput(currentValue.slice(0, -1));
}

function adjustWorkoutInputValue(
  target: WorkoutInputTarget,
  currentValue: string,
  direction: -1 | 1,
) {
  if (target.field === 'durationMinutes') {
    const numericValue = currentValue.trim()
      ? parseDurationMinutesInput(currentValue, 0) ?? 0
      : 0;

    return formatDurationMinutes(
      Math.max(0, numericValue + direction * target.step),
    );
  }

  if (target.field === 'load') {
    const numericValue = currentValue.trim() ? Number.parseFloat(currentValue) : 0;
    const nextValue = Math.max(0, numericValue + direction * target.step);
    return formatLoadValue(nextValue);
  }

  const numericValue = currentValue.trim() ? Number.parseInt(currentValue, 10) : 0;
  return String(Math.max(0, numericValue + direction * target.step));
}

function getWorkoutInputSpecialKey(field: WorkoutInputField) {
  if (field === 'durationMinutes') {
    return '00';
  }

  if (field === 'load') {
    return '.';
  }

  return null;
}

export function WorkoutSessionPreview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const {
    addWorkoutExercise,
    addWorkoutSetRow,
    cancelWorkoutSession,
    finishWorkoutSession,
    removeWorkoutExercise,
    removeWorkoutSetRow,
    replaceWorkoutExercise,
    state,
    toggleWorkoutSetCompletion,
    updateWorkoutSessionTitle,
    updateWorkoutSetType,
    updateWorkoutSetValue,
  } = useAppData();
  const activeWorkout = getActiveWorkoutSessionView(state);
  const [clock, setClock] = useState(() => new Date());
  const [activeExerciseAction, setActiveExerciseAction] = useState<{
    exerciseId: string;
    exerciseName: string;
  } | null>(null);
  const [pickerState, setPickerState] = useState<PickerState | null>(null);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [composerContext, setComposerContext] = useState<PickerState | null>(null);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [exerciseFilterGroup, setExerciseFilterGroup] =
    useState<ExerciseFilterGroup>('all');
  const [exerciseFilterType, setExerciseFilterType] =
    useState<ExerciseFilterType>('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerDraft, setComposerDraft] = useState<ExerciseComposerDraft>(
    DEFAULT_COMPOSER_DRAFT,
  );
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [titleDraft, setTitleDraft] = useState('');
  const [celebratingExerciseId, setCelebratingExerciseId] = useState<string | null>(null);
  const [activeInputKey, setActiveInputKey] = useState<string | null>(null);
  const [replaceInputOnNextKey, setReplaceInputOnNextKey] = useState(false);
  const [inputBoardHeight, setInputBoardHeight] = useState(
    WORKOUT_INPUT_BOARD_DEFAULT_HEIGHT,
  );
  const [activeSetTypeTarget, setActiveSetTypeTarget] = useState<{
    exerciseId: string;
    rowKey: string;
    setNumber: number;
  } | null>(null);
  const previousCompletionMapRef = useRef<Record<string, boolean>>({});
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});
  const scrollViewRef = useRef<ScrollView | null>(null);
  const scrollOffsetRef = useRef(0);
  const setRowRefs = useRef<Record<string, View | null>>({});
  const completedSetCount = useMemo(
    () =>
      activeWorkout?.exercises.reduce(
        (total, exercise) => total + exercise.completedSets,
        0,
      ) ?? 0,
    [activeWorkout],
  );
  const workoutInputTargets = useMemo<WorkoutInputTarget[]>(
    () =>
      activeWorkout?.exercises.flatMap((exercise) =>
        exercise.sets.flatMap<WorkoutInputTarget>((setRow) => {
          const rowKey = getSetRowKey(exercise.id, setRow);

          if (exercise.trackingMode === 'duration') {
            return [
              {
                exercise,
                fallbackValue:
                  setRow.durationMinutes ?? exercise.targetDurationMinutes ?? 20,
                field: 'durationMinutes' as const,
                fieldLabel: 'Duration',
                key: getWorkoutInputKey(exercise.id, rowKey, 'durationMinutes'),
                rowKey,
                setRow,
                step: DURATION_STEP_MINUTES,
                unitLabel: 'MM:SS',
              },
            ];
          }

          return [
            {
              exercise,
              fallbackValue: setRow.load,
              field: 'load' as const,
              fieldLabel: 'Load',
              key: getWorkoutInputKey(exercise.id, rowKey, 'load'),
              rowKey,
              setRow,
              step: LOAD_STEP,
              unitLabel: 'LB',
            },
            {
              exercise,
              fallbackValue: setRow.reps,
              field: 'reps' as const,
              fieldLabel: 'Reps',
              key: getWorkoutInputKey(exercise.id, rowKey, 'reps'),
              rowKey,
              setRow,
              step: REPS_STEP,
              unitLabel: 'REPS',
            },
          ];
        }),
      ) ?? [],
    [activeWorkout],
  );
  const activeInputTarget = useMemo(
    () =>
      workoutInputTargets.find((target) => target.key === activeInputKey) ?? null,
    [activeInputKey, workoutInputTargets],
  );

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setTitleDraft(activeWorkout?.session.title ?? '');
  }, [activeWorkout?.session.id, activeWorkout?.session.title]);

  useEffect(() => {
    if (activeInputKey && !activeInputTarget) {
      setActiveInputKey(null);
      setReplaceInputOnNextKey(false);
    }
  }, [activeInputKey, activeInputTarget]);

  useEffect(() => {
    if (!activeWorkout) {
      previousCompletionMapRef.current = {};
      return;
    }

    const nextCompletionMap = activeWorkout.exercises.reduce<Record<string, boolean>>(
      (completionMap, exercise) => {
        completionMap[exercise.id] = exercise.allSetsCompleted;
        return completionMap;
      },
      {},
    );

    const newlyCompletedExercise = activeWorkout.exercises.find(
      (exercise) =>
        exercise.allSetsCompleted && !previousCompletionMapRef.current[exercise.id],
    );

    if (newlyCompletedExercise) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCelebratingExerciseId(newlyCompletedExercise.id);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const timeout = setTimeout(() => {
        setCelebratingExerciseId((currentValue) =>
          currentValue === newlyCompletedExercise.id ? null : currentValue,
        );
      }, 900);

      previousCompletionMapRef.current = nextCompletionMap;
      return () => clearTimeout(timeout);
    }

    previousCompletionMapRef.current = nextCompletionMap;
  }, [activeWorkout]);

  useEffect(() => {
    if (!activeInputTarget) {
      return;
    }

    const timeout = setTimeout(() => {
      const targetRow = setRowRefs.current[activeInputTarget.rowKey];

      if (!targetRow) {
        return;
      }

      targetRow.measureInWindow((_x, y, _width, height) => {
        const availableBottom =
          windowHeight - inputBoardHeight - Math.max(insets.bottom, Spacing.sm) - 16;
        const overflow = y + height - availableBottom;

        if (overflow > 0) {
          scrollViewRef.current?.scrollTo({
            animated: true,
            y: Math.max(0, scrollOffsetRef.current + overflow + 18),
          });
        }
      });
    }, 40);

    return () => clearTimeout(timeout);
  }, [activeInputTarget, insets.bottom, inputBoardHeight, windowHeight]);

  const exerciseOptions = useMemo(() => {
    return [...state.exerciseLibrary]
      .filter((exercise) => exercise.name.trim())
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [state.exerciseLibrary]);

  const filteredExerciseOptions = useMemo(() => {
    const query = exerciseSearchQuery.trim();
    return [...exerciseOptions]
      .filter((exercise) =>
        matchesExerciseFilterGroup(exercise, exerciseFilterGroup) &&
        matchesExerciseFilterType(exercise, exerciseFilterType),
      )
      .filter((exercise) => !query || searchExerciseLibraryEntry(exercise, query))
      .sort((left, right) => {
        const leftScore = query ? getExerciseSearchScore(left, query) : 0;
        const rightScore = query ? getExerciseSearchScore(right, query) : 0;

        if (leftScore !== rightScore) {
          return rightScore - leftScore;
        }

        return left.name.localeCompare(right.name);
      });
  }, [exerciseFilterGroup, exerciseFilterType, exerciseOptions, exerciseSearchQuery]);

  function getSetRowKey(exerciseId: string, setRow: ActiveWorkoutSetView) {
    return setRow.id ?? `${exerciseId}:${setRow.setNumber}`;
  }

  function getDraftKey(
    sessionExerciseId: string,
    rowKey: string,
    field: 'durationMinutes' | 'load' | 'reps',
  ) {
    return `${sessionExerciseId}:${rowKey}:${field}`;
  }

  function getInputValue(
    sessionExerciseId: string,
    rowKey: string,
    field: 'durationMinutes' | 'load' | 'reps',
    fallbackValue: number,
  ) {
    const draftKey = getDraftKey(sessionExerciseId, rowKey, field);
    const draftValue = draftValues[draftKey];

    if (draftValue !== undefined) {
      return draftValue;
    }

    return field === 'durationMinutes'
      ? formatDurationMinutes(fallbackValue)
      : String(fallbackValue);
  }

  function handleDraftChange(
    sessionExerciseId: string,
    rowKey: string,
    field: 'durationMinutes' | 'load' | 'reps',
    value: string,
  ) {
    const draftKey = getDraftKey(sessionExerciseId, rowKey, field);
    setDraftValues((currentValue) => ({
      ...currentValue,
      [draftKey]:
        field === 'durationMinutes'
          ? formatDurationInput(value)
          : field === 'load'
            ? sanitizeLoadInput(value)
            : sanitizeIntegerInput(value),
    }));
  }

  function commitDraftValue(
    exercise: ActiveWorkoutExerciseView,
    setRow: ActiveWorkoutSetView,
    field: 'durationMinutes' | 'load' | 'reps',
    fallbackValue: number,
  ) {
    const draftKey = getDraftKey(exercise.id, getSetRowKey(exercise.id, setRow), field);
    const rawValue = draftValues[draftKey];
    const normalizedValue =
      rawValue === undefined || rawValue.trim() === ''
        ? fallbackValue
        : field === 'durationMinutes'
          ? parseDurationMinutesInput(rawValue, fallbackValue)
          : Number.parseFloat(rawValue);

    if (normalizedValue !== null && Number.isFinite(normalizedValue) && normalizedValue >= 0) {
      updateWorkoutSetValue(exercise.id, setRow.setNumber, field, normalizedValue);
      setDraftValues((currentValue) => ({
        ...currentValue,
        [draftKey]:
          field === 'durationMinutes'
            ? formatDurationMinutes(normalizedValue)
            : String(normalizedValue),
      }));
      return;
    }

    setDraftValues((currentValue) => ({
      ...currentValue,
      [draftKey]:
        field === 'durationMinutes'
          ? formatDurationMinutes(fallbackValue)
          : String(fallbackValue),
    }));
  }

  function getTargetInputValue(target: WorkoutInputTarget) {
    return getInputValue(
      target.exercise.id,
      target.rowKey,
      target.field,
      target.fallbackValue,
    );
  }

  function commitInputTarget(target: WorkoutInputTarget | null) {
    if (!target) {
      return;
    }

    commitDraftValue(target.exercise, target.setRow, target.field, target.fallbackValue);
  }

  function closeInputBoard(options?: { commit?: boolean }) {
    if (activeInputKey) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }

    if (options?.commit !== false) {
      commitInputTarget(activeInputTarget);
    }

    setActiveInputKey(null);
    setReplaceInputOnNextKey(false);
  }

  function openInputTarget(targetKey: string) {
    Keyboard.dismiss();
    setActiveExerciseAction(null);
    setActiveSetTypeTarget(null);

    if (activeInputTarget && activeInputTarget.key !== targetKey) {
      commitInputTarget(activeInputTarget);
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveInputKey(targetKey);
    setReplaceInputOnNextKey(true);
  }

  function updateActiveInputDraft(nextValue: string) {
    if (!activeInputTarget) {
      return;
    }

    handleDraftChange(
      activeInputTarget.exercise.id,
      activeInputTarget.rowKey,
      activeInputTarget.field,
      nextValue,
    );
    setReplaceInputOnNextKey(false);
  }

  function handleInputBoardKeyPress(token: string) {
    if (!activeInputTarget) {
      return;
    }

    const nextValue = appendWorkoutInputValue(
      activeInputTarget.field,
      getTargetInputValue(activeInputTarget),
      token,
      replaceInputOnNextKey,
    );

    updateActiveInputDraft(nextValue);
  }

  function handleInputBoardBackspace() {
    if (!activeInputTarget) {
      return;
    }

    const nextValue = removeWorkoutInputCharacter(
      activeInputTarget.field,
      getTargetInputValue(activeInputTarget),
      replaceInputOnNextKey,
    );

    updateActiveInputDraft(nextValue);
  }

  function handleInputBoardStep(direction: -1 | 1) {
    if (!activeInputTarget) {
      return;
    }

    const nextValue = adjustWorkoutInputValue(
      activeInputTarget,
      getTargetInputValue(activeInputTarget),
      direction,
    );

    updateActiveInputDraft(nextValue);
  }

  function handleInputBoardNext() {
    if (!activeInputTarget) {
      return;
    }

    const currentIndex = workoutInputTargets.findIndex(
      (target) => target.key === activeInputTarget.key,
    );
    const nextTarget = workoutInputTargets[currentIndex + 1] ?? null;

    if (!nextTarget) {
      closeInputBoard();
      return;
    }

    commitInputTarget(activeInputTarget);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveInputKey(nextTarget.key);
    setReplaceInputOnNextKey(true);
  }

  function handleToggleSet(
    exercise: ActiveWorkoutExerciseView,
    setRow: ActiveWorkoutSetView,
  ) {
    if (
      activeInputTarget &&
      (activeInputTarget.exercise.id !== exercise.id ||
        activeInputTarget.setRow.setNumber !== setRow.setNumber)
    ) {
      commitInputTarget(activeInputTarget);
    }

    if (exercise.trackingMode === 'duration') {
      commitDraftValue(
        exercise,
        setRow,
        'durationMinutes',
        setRow.durationMinutes ?? exercise.targetDurationMinutes ?? 20,
      );
    } else {
      commitDraftValue(exercise, setRow, 'load', setRow.load);
      commitDraftValue(exercise, setRow, 'reps', setRow.reps);
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleWorkoutSetCompletion(exercise.id, setRow.setNumber);
  }

  function handleOpenExercisePicker(
    mode: 'add' | 'replace',
    targetExerciseId: string | null = null,
  ) {
    closeInputBoard();
    setExerciseSearchQuery('');
    setSelectedExerciseIds([]);
    setExerciseFilterGroup('all');
    setExerciseFilterType('all');
    setActiveExerciseAction(null);
    setActiveSetTypeTarget(null);
    requestAnimationFrame(() => {
      setPickerState({ mode, targetExerciseId });
    });
  }

  function handleSelectExerciseDraft(draft: WorkoutExerciseDraft) {
    const selectionContext = pickerState ?? composerContext;

    if (!activeWorkout || !selectionContext) {
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (selectionContext.mode === 'add') {
      addWorkoutExercise(activeWorkout.session.id, draft);
    } else if (selectionContext.targetExerciseId) {
      replaceWorkoutExercise(selectionContext.targetExerciseId, draft);
    }

    setPickerState(null);
    setSelectedExerciseIds([]);
    setComposerContext(null);
    setComposerOpen(false);
    setActiveExerciseAction(null);
    setActiveSetTypeTarget(null);
    setActiveInputKey(null);
    setReplaceInputOnNextKey(false);
  }

  function handleOpenCustomComposer() {
    if (!pickerState) {
      return;
    }

    setComposerDraft({
      ...DEFAULT_COMPOSER_DRAFT,
      name: exerciseSearchQuery.trim(),
    });
    setComposerContext(pickerState);
    setPickerState(null);
    setComposerOpen(true);
  }

  function handleToggleExerciseSelection(exerciseId: string) {
    setSelectedExerciseIds((currentValue) =>
      currentValue.includes(exerciseId)
        ? currentValue.filter((id) => id !== exerciseId)
        : [...currentValue, exerciseId],
    );
  }

  function handleAddSelectedExercises() {
    if (!activeWorkout || !pickerState || pickerState.mode !== 'add' || selectedExerciseIds.length === 0) {
      return;
    }

    const selectedExercises = exerciseOptions.filter((exercise) =>
      selectedExerciseIds.includes(exercise.id),
    );

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    selectedExercises.forEach((exercise) => {
      const trackingMode = inferExerciseTrackingMode(exercise);
      addWorkoutExercise(activeWorkout.session.id, {
        name: exercise.name,
        repRange: trackingMode === 'duration' ? '20:00' : '8-10',
        targetDurationMinutes: trackingMode === 'duration' ? 20 : undefined,
        targetReps: trackingMode === 'duration' ? undefined : 8,
        targetSets: 3,
        trackingMode,
      });
    });

    setPickerState(null);
    setSelectedExerciseIds([]);
  }

  function handleSaveCustomExercise() {
    const trimmedName = composerDraft.name.trim();
    const targetSets = 1;

    if (!trimmedName) {
      return;
    }

    if (composerDraft.trackingMode === 'duration') {
      const parsedDurationMinutes = parseDurationMinutesInput(
        composerDraft.durationMinutes,
        20,
      );

      if (parsedDurationMinutes === null) {
        return;
      }

      const targetDurationMinutes = Math.max(1 / 60, parsedDurationMinutes);

      handleSelectExerciseDraft({
        name: trimmedName,
        targetSets,
        targetDurationMinutes,
        trackingMode: 'duration',
      });
      return;
    }

    handleSelectExerciseDraft({
      name: trimmedName,
      targetSets,
      trackingMode: 'strength',
    });
  }

  function handleFinishWorkout() {
    if (!activeWorkout) {
      return;
    }

    commitInputTarget(activeInputTarget);

    if (activeWorkout.exercises.length === 0 || completedSetCount === 0) {
      cancelWorkoutSession(activeWorkout.session.id);
      router.back();
      return;
    }

    finishWorkoutSession(activeWorkout.session.id);
    router.back();
  }

  function handleCancelWorkout() {
    if (!activeWorkout) {
      return;
    }

    Alert.alert(
      'Cancel workout?',
      'This will discard the current workout and remove it from your active session.',
      [
        { text: 'Keep workout', style: 'cancel' },
        {
          text: 'Cancel workout',
          style: 'destructive',
          onPress: () => {
            cancelWorkoutSession(activeWorkout.session.id);
            router.back();
          },
        },
      ],
    );
  }

  if (!activeWorkout) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <View style={styles.emptyStateWrap}>
          <SurfaceCard style={styles.emptyCard}>
            <AppText variant="headline">No active session</AppText>
            <AppText dimmed>
              Start a workout from the Gym tab. Your active session is always stored locally.
            </AppText>
            <ActionButton label="Back to Gym" onPress={() => router.back()} variant="ghost" />
          </SurfaceCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <PressScale
            haptic="none"
            onPress={() => {
              commitInputTarget(activeInputTarget);
              router.back();
            }}
          >
            <View style={styles.headerButton}>
              <Ionicons name="chevron-back" size={18} color={AppColors.text} />
            </View>
          </PressScale>
          <View style={styles.headerCopy}>
            <TextInput
              onFocus={() => closeInputBoard()}
              onBlur={() => updateWorkoutSessionTitle(activeWorkout.session.id, titleDraft)}
              onChangeText={setTitleDraft}
              placeholder="Workout"
              placeholderTextColor={AppColors.textSubtle}
              style={styles.titleInput}
              value={titleDraft}
            />
            <AppText variant="micro" dimmed>
              {formatWorkoutDate(activeWorkout.session.startedAt)}
            </AppText>
          </View>
          <HeaderTimer value={formatWorkoutTimerLabel(activeWorkout.session.startedAt, clock)} />
          <PressScale haptic="none" onPress={handleFinishWorkout}>
            <View style={styles.finishButton}>
              <AppText variant="label" color={AppColors.white}>
                Finish
              </AppText>
            </View>
          </PressScale>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          activeInputTarget
            ? {
                paddingBottom:
                  inputBoardHeight + Math.max(insets.bottom, Spacing.sm) + Spacing.lg,
              }
            : null,
        ]}
        onScroll={(event) => {
          scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {activeWorkout.exercises.map((exercise) => (
          <SurfaceCard
            key={exercise.id}
            style={[
              styles.exerciseCard,
              exercise.allSetsCompleted ? styles.exerciseCardCompleted : null,
              celebratingExerciseId === exercise.id ? styles.exerciseCardCelebrating : null,
              activeExerciseAction?.exerciseId === exercise.id ||
              activeSetTypeTarget?.exerciseId === exercise.id ||
              activeInputTarget?.exercise.id === exercise.id
                ? styles.exerciseCardOverlayActive
                : null,
            ]}
          >
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseHeaderCopy}>
                <AppText variant="bodyStrong">{exercise.name}</AppText>
              </View>
              <View style={styles.exerciseHeaderActions}>
                <PressScale
                  haptic="none"
                  onPress={() =>
                    {
                      closeInputBoard();
                      setActiveSetTypeTarget(null);
                      setActiveExerciseAction((currentValue) =>
                        currentValue?.exerciseId === exercise.id
                          ? null
                          : {
                              exerciseId: exercise.id,
                              exerciseName: exercise.name,
                            },
                      );
                    }
                  }
                >
                  <View style={styles.moreButton}>
                    <Ionicons name="ellipsis-horizontal" size={16} color={AppColors.text} />
                  </View>
                </PressScale>
                <PressScale
                  haptic="none"
                  onPress={() => {
                    closeInputBoard();
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    addWorkoutSetRow(exercise.id);
                  }}
                >
                  <View style={styles.addSetHeaderButton}>
                    <Ionicons name="add" size={16} color={AppColors.primary} />
                    <AppText variant="label" color={AppColors.primary}>
                      Add set
                    </AppText>
                  </View>
                </PressScale>
              </View>
            </View>

            <View style={styles.setHeaderRow}>
              <AppText variant="micro" dimmed style={styles.setNumberHeader}>
                SET
              </AppText>
              <AppText variant="micro" dimmed style={styles.setPreviousHeader}>
                PREVIOUS
              </AppText>
              {exercise.trackingMode === 'duration' ? (
                <AppText variant="micro" dimmed style={styles.setInputHeaderWide}>
                  DURATION
                </AppText>
              ) : (
                <>
                  <AppText variant="micro" dimmed style={styles.setInputHeader}>
                    LB
                  </AppText>
                  <AppText variant="micro" dimmed style={styles.setInputHeader}>
                    REPS
                  </AppText>
                </>
              )}
              <View style={styles.setActionSpacer} />
            </View>

            <View style={styles.setRows}>
              {exercise.sets.map((setRow) => {
                const rowKey = getSetRowKey(exercise.id, setRow);

                return (
                  <View
                    key={rowKey}
                    ref={(instance) => {
                      setRowRefs.current[rowKey] = instance;
                    }}
                    style={[
                      styles.setRowWrap,
                      (
                        activeSetTypeTarget?.exerciseId === exercise.id &&
                        activeSetTypeTarget.rowKey === rowKey
                      ) ||
                      activeInputTarget?.rowKey === rowKey
                        ? styles.setRowWrapActive
                        : null,
                    ]}>
                    <Swipeable
                      ref={(instance) => {
                        swipeableRefs.current[rowKey] = instance;
                      }}
                      friction={2}
                      onSwipeableWillOpen={() => {
                        closeInputBoard();
                        setActiveExerciseAction(null);
                        setActiveSetTypeTarget(null);
                        Object.entries(swipeableRefs.current).forEach(([key, instance]) => {
                          if (key !== rowKey) {
                            instance?.close();
                          }
                        });
                      }}
                      overshootRight={false}
                      rightThreshold={72}
                      renderRightActions={() => (
                        <PressScale
                          haptic="none"
                          onPress={() => {
                            closeInputBoard({ commit: false });
                            swipeableRefs.current[rowKey]?.close();
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            if (
                              activeSetTypeTarget?.exerciseId === exercise.id &&
                              activeSetTypeTarget.rowKey === rowKey
                            ) {
                              setActiveSetTypeTarget(null);
                            }
                            removeWorkoutSetRow(exercise.id, setRow.id, setRow.setNumber);
                          }}
                        >
                          <View style={styles.deleteSetAction}>
                            <Ionicons name="trash-outline" size={16} color={AppColors.white} />
                            <AppText variant="micro" color={AppColors.white}>
                              Delete
                            </AppText>
                          </View>
                        </PressScale>
                      )}>
                      <View
                        style={[
                          styles.setRow,
                          setRow.completed ? styles.setRowCompleted : null,
                        ]}>
                        <PressScale
                          haptic="none"
                          onPress={() => {
                            closeInputBoard();
                            setActiveExerciseAction(null);
                            setActiveSetTypeTarget((currentValue) =>
                              currentValue?.exerciseId === exercise.id &&
                              currentValue.rowKey === rowKey
                                ? null
                                : {
                                    exerciseId: exercise.id,
                                    rowKey,
                                    setNumber: setRow.setNumber,
                                  },
                            );
                          }}
                        >
                          <View
                            style={[
                              styles.setNumberCell,
                              {
                                backgroundColor: getSetTypeBackground(
                                  setRow.setType,
                                  setRow.completed,
                                ),
                              },
                            ]}
                          >
                            <AppText
                              variant="label"
                              color={getSetTypeColor(setRow.setType, setRow.completed)}
                            >
                              {getSetTypeBadgeLabel(setRow)}
                            </AppText>
                          </View>
                        </PressScale>
                        <View style={styles.setPreviousCell}>
                          <AppText variant="micro" dimmed numberOfLines={1}>
                            {formatPreviousSetText(exercise)}
                          </AppText>
                        </View>
                        {exercise.trackingMode === 'duration' ? (
                          <WorkoutSetInput
                            active={
                              activeInputKey ===
                              getWorkoutInputKey(exercise.id, rowKey, 'durationMinutes')
                            }
                            onPress={() =>
                              openInputTarget(
                                getWorkoutInputKey(exercise.id, rowKey, 'durationMinutes'),
                              )
                            }
                            style={styles.durationInput}
                            value={getInputValue(
                              exercise.id,
                              rowKey,
                              'durationMinutes',
                              setRow.durationMinutes ?? exercise.targetDurationMinutes ?? 20,
                            )}
                          />
                        ) : (
                          <>
                            <WorkoutSetInput
                              active={
                                activeInputKey ===
                                getWorkoutInputKey(exercise.id, rowKey, 'load')
                              }
                              onPress={() =>
                                openInputTarget(
                                  getWorkoutInputKey(exercise.id, rowKey, 'load'),
                                )
                              }
                              value={getInputValue(
                                exercise.id,
                                rowKey,
                                'load',
                                setRow.load,
                              )}
                            />
                            <WorkoutSetInput
                              active={
                                activeInputKey ===
                                getWorkoutInputKey(exercise.id, rowKey, 'reps')
                              }
                              onPress={() =>
                                openInputTarget(
                                  getWorkoutInputKey(exercise.id, rowKey, 'reps'),
                                )
                              }
                              value={getInputValue(
                                exercise.id,
                                rowKey,
                                'reps',
                                setRow.reps,
                              )}
                            />
                          </>
                        )}
                        <PressScale
                          haptic="none"
                          onPress={() => handleToggleSet(exercise, setRow)}
                        >
                          <View
                            style={[
                              styles.setCheckButton,
                              setRow.completed ? styles.setCheckButtonCompleted : null,
                            ]}
                          >
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color={
                                setRow.completed ? AppColors.white : AppColors.textSubtle
                              }
                            />
                          </View>
                        </PressScale>
                      </View>
                    </Swipeable>
                  </View>
                );
              })}
            </View>
          </SurfaceCard>
        ))}

        <View style={styles.footerButtons}>
          <ActionButton
            label="Add Exercise"
            onPress={() => {
              closeInputBoard();
              handleOpenExercisePicker('add');
            }}
            variant="primary"
          />
          <PressScale haptic="none" onPress={handleCancelWorkout}>
            <View style={styles.cancelWorkoutButton}>
              <AppText variant="label" color={AppColors.danger}>
                Cancel Workout
              </AppText>
            </View>
          </PressScale>
        </View>
        <View style={styles.listFooterSpacer} />
      </ScrollView>

      {activeInputTarget ? (
        <WorkoutInputBoard
          activeTarget={activeInputTarget}
          isLastTarget={
            workoutInputTargets[workoutInputTargets.length - 1]?.key ===
            activeInputTarget.key
          }
          onBackspace={handleInputBoardBackspace}
          onDismiss={closeInputBoard}
          onKeyPress={handleInputBoardKeyPress}
          onLayout={(event) => {
            setInputBoardHeight(event.nativeEvent.layout.height);
          }}
          onNext={handleInputBoardNext}
          onStep={handleInputBoardStep}
        />
      ) : null}

      <ExercisePickerModal
        canCreateCustomExercise={exerciseSearchQuery.trim().length > 0}
        filterGroup={exerciseFilterGroup}
        filterType={exerciseFilterType}
        exerciseOptions={filteredExerciseOptions}
        isOpen={Boolean(pickerState)}
        onClose={() => setPickerState(null)}
        onCommitSelection={handleAddSelectedExercises}
        onCreateCustom={handleOpenCustomComposer}
        onSelect={(exercise) => {
          if (pickerState?.mode === 'add') {
            handleToggleExerciseSelection(exercise.id);
            return;
          }

          const trackingMode = inferExerciseTrackingMode(exercise);
          handleSelectExerciseDraft({
            currentLoad: trackingMode === 'duration' ? 0 : 45,
            name: exercise.name,
            repRange: trackingMode === 'duration' ? '20:00' : '8-10',
            targetDurationMinutes: trackingMode === 'duration' ? 20 : undefined,
            targetReps: trackingMode === 'duration' ? undefined : 8,
            targetSets: 3,
            trackingMode,
          });
        }}
        pickerMode={pickerState?.mode ?? 'add'}
        searchQuery={exerciseSearchQuery}
        selectedExerciseIds={selectedExerciseIds}
        setFilterGroup={setExerciseFilterGroup}
        setFilterType={setExerciseFilterType}
        setSearchQuery={setExerciseSearchQuery}
        title={pickerState?.mode === 'replace' ? 'Replace exercise' : 'Add exercise'}
      />

      <ExerciseComposerModal
        draft={composerDraft}
        isOpen={composerOpen}
        onChange={setComposerDraft}
        onClose={() => {
          setComposerOpen(false);
          setComposerContext(null);
          if (pickerState === null) {
            setExerciseSearchQuery('');
          }
        }}
        onSave={handleSaveCustomExercise}
      />
      <ExerciseActionModal
        isOpen={Boolean(activeExerciseAction)}
        onClose={() => setActiveExerciseAction(null)}
        onRemove={() => {
          if (!activeExerciseAction) {
            return;
          }

          const { exerciseId, exerciseName } = activeExerciseAction;
          setActiveExerciseAction(null);
          Alert.alert(
            'Remove exercise?',
            `Remove "${exerciseName}" from this workout?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  removeWorkoutExercise(exerciseId);
                },
              },
            ],
          );
        }}
        onReplace={() => {
          if (!activeExerciseAction) {
            return;
          }

          const exerciseId = activeExerciseAction.exerciseId;
          setActiveExerciseAction(null);
          handleOpenExercisePicker('replace', exerciseId);
        }}
      />
      <SetTypeModal
        isOpen={Boolean(activeSetTypeTarget)}
        onClose={() => setActiveSetTypeTarget(null)}
        onSelect={(value) => {
          if (!activeSetTypeTarget) {
            return;
          }

          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          updateWorkoutSetType(
            activeSetTypeTarget.exerciseId,
            activeSetTypeTarget.setNumber,
            value,
          );
          setActiveSetTypeTarget(null);
        }}
      />
    </SafeAreaView>
  );
}

function HeaderTimer({ value }: { value: string }) {
  return (
    <View style={styles.timerPill}>
      <Ionicons name="time-outline" size={14} color={AppColors.primary} />
      <AppText variant="bodyStrong" color={AppColors.primary}>
        {value}
      </AppText>
    </View>
  );
}

function WorkoutSetInput({
  active = false,
  onPress,
  style,
  value,
}: {
  active?: boolean;
  onPress: () => void;
  style?: object;
  value: string;
}) {
  return (
    <PressScale containerStyle={[styles.setInputPressable, style]} haptic="none" onPress={onPress}>
      <View style={[styles.setInputShell, active ? styles.setInputShellActive : null]}>
        <AppText
          variant="bodyStrong"
          color={active ? AppColors.primary : AppColors.text}
          numberOfLines={1}
          style={styles.setInputValue}
        >
          {value || '0'}
        </AppText>
      </View>
    </PressScale>
  );
}

function WorkoutInputBoard({
  activeTarget,
  isLastTarget,
  onBackspace,
  onDismiss,
  onKeyPress,
  onLayout,
  onNext,
  onStep,
}: {
  activeTarget: WorkoutInputTarget;
  isLastTarget: boolean;
  onBackspace: () => void;
  onDismiss: () => void;
  onKeyPress: (token: string) => void;
  onLayout: (event: { nativeEvent: { layout: { height: number } } }) => void;
  onNext: () => void;
  onStep: (direction: -1 | 1) => void;
}) {
  const specialKey = getWorkoutInputSpecialKey(activeTarget.field);
  const keypadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [specialKey, '0', 'backspace'],
  ];

  return (
    <View onLayout={onLayout} style={styles.inputBoardWrap}>
      <SurfaceCard floating style={styles.inputBoardCard}>
        <View style={styles.inputBoardBody}>
          <View style={styles.inputBoardKeypad}>
            {keypadRows.map((row, rowIndex) => (
              <View key={`board-row-${rowIndex}`} style={styles.inputBoardKeypadRow}>
                {row.map((keyValue) => {
                  const isBackspaceKey = keyValue === 'backspace';
                  const isDisabledKey = keyValue === null;

                  return (
                    <Pressable
                      key={`board-key-${keyValue ?? 'empty'}-${rowIndex}`}
                      disabled={isDisabledKey}
                      onPress={() => {
                        if (isBackspaceKey) {
                          onBackspace();
                          return;
                        }

                        if (keyValue) {
                          onKeyPress(keyValue);
                        }
                      }}
                      style={({ pressed }) => [
                        styles.inputBoardKey,
                        isDisabledKey ? styles.inputBoardKeyDisabled : null,
                        pressed ? styles.inputBoardButtonPressed : null,
                      ]}
                    >
                      {isBackspaceKey ? (
                        <Ionicons name="backspace-outline" size={20} color={AppColors.text} />
                      ) : (
                        <AppText
                          variant="title"
                          color={isDisabledKey ? AppColors.textSubtle : AppColors.text}
                        >
                          {keyValue ?? ''}
                        </AppText>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.inputBoardRail}>
            <Pressable
              hitSlop={8}
              onPress={onDismiss}
              style={({ pressed }) => [
                styles.inputBoardRailButton,
                pressed ? styles.inputBoardButtonPressed : null,
              ]}
            >
              <Ionicons name="keypad-outline" size={18} color={AppColors.textMuted} />
              <AppText variant="micro" color={AppColors.textMuted}>
                Hide
              </AppText>
            </Pressable>

            <View style={styles.inputBoardStepperRow}>
              <Pressable
                hitSlop={8}
                onPress={() => onStep(-1)}
                style={({ pressed }) => [
                  styles.inputBoardStepperAction,
                  pressed ? styles.inputBoardButtonPressed : null,
                ]}
              >
                <Ionicons name="remove" size={18} color={AppColors.primary} />
              </Pressable>
              <Pressable
                hitSlop={8}
                onPress={() => onStep(1)}
                style={({ pressed }) => [
                  styles.inputBoardStepperAction,
                  pressed ? styles.inputBoardButtonPressed : null,
                ]}
              >
                <Ionicons name="add" size={18} color={AppColors.primary} />
              </Pressable>
            </View>

            <Pressable
              hitSlop={8}
              onPress={onNext}
              style={({ pressed }) => [
                styles.inputBoardNextButton,
                pressed ? styles.inputBoardNextButtonPressed : null,
              ]}
            >
              <AppText variant="label" color={AppColors.white}>
                {isLastTarget ? 'Done' : 'Next'}
              </AppText>
              <Ionicons
                name={isLastTarget ? 'checkmark' : 'arrow-forward'}
                size={16}
                color={AppColors.white}
              />
            </Pressable>
          </View>
        </View>
      </SurfaceCard>
    </View>
  );
}

function ExercisePickerModal({
  canCreateCustomExercise,
  filterGroup,
  filterType,
  exerciseOptions,
  isOpen,
  onCommitSelection,
  onClose,
  onCreateCustom,
  onSelect,
  pickerMode,
  searchQuery,
  selectedExerciseIds,
  setFilterGroup,
  setFilterType,
  setSearchQuery,
  title,
}: {
  canCreateCustomExercise: boolean;
  filterGroup: ExerciseFilterGroup;
  filterType: ExerciseFilterType;
  exerciseOptions: ExerciseLibraryEntry[];
  isOpen: boolean;
  onCommitSelection: () => void;
  onClose: () => void;
  onCreateCustom: () => void;
  onSelect: (exercise: ExerciseLibraryEntry) => void;
  pickerMode: 'add' | 'replace';
  searchQuery: string;
  selectedExerciseIds: string[];
  setFilterGroup: (value: ExerciseFilterGroup) => void;
  setFilterType: (value: ExerciseFilterType) => void;
  setSearchQuery: (value: string) => void;
  title: string;
}) {
  const [activeFilterMenu, setActiveFilterMenu] = useState<'group' | 'type' | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveFilterMenu(null);
    }
  }, [isOpen]);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={isOpen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.modalRoot}>
        <PressScale containerStyle={styles.modalBackdrop} haptic="none" onPress={onClose}>
          <View />
        </PressScale>
        <KeyboardAvoidingView
          behavior={undefined}
          style={styles.modalContainer}
        >
          <SurfaceCard style={styles.modalCardLarge}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeading}>
                <PressScale haptic="none" onPress={onClose}>
                  <View style={styles.headerButton}>
                    <Ionicons name="close" size={18} color={AppColors.text} />
                  </View>
                </PressScale>
                <AppText variant="title">{title}</AppText>
              </View>
              {pickerMode === 'add' ? (
                <PressScale
                  haptic="none"
                  onPress={onCommitSelection}
                  disabled={selectedExerciseIds.length === 0}
                >
                  <View style={styles.headerAddButton}>
                    <AppText
                      variant="label"
                      color={
                        selectedExerciseIds.length > 0
                          ? AppColors.primary
                          : AppColors.textSubtle
                      }
                    >
                      {selectedExerciseIds.length > 0
                        ? `add (${selectedExerciseIds.length})`
                        : 'add'}
                    </AppText>
                  </View>
                </PressScale>
              ) : (
                <View style={styles.headerAddButtonPlaceholder} />
              )}
            </View>
            <View style={styles.searchField}>
              <Ionicons name="search" size={18} color={AppColors.textSubtle} />
              <TextInput
                autoCapitalize="none"
                onChangeText={setSearchQuery}
                placeholder="search exercise"
                placeholderTextColor={AppColors.textSubtle}
                style={styles.searchInput}
                value={searchQuery}
              />
            </View>
            <View style={styles.filterControlRow}>
              <PressScale
                containerStyle={styles.filterSelectorSlot}
                haptic="none"
                onPress={() =>
                  setActiveFilterMenu((currentValue) =>
                    currentValue === 'group' ? null : 'group',
                  )
                }
              >
                <View style={styles.filterSelector}>
                  <AppText variant="micro" color={AppColors.textMuted}>
                    {formatPrimaryFilterLabel(filterGroup)}
                  </AppText>
                  <Ionicons
                    name={activeFilterMenu === 'group' ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={AppColors.textMuted}
                  />
                </View>
              </PressScale>
              <PressScale
                containerStyle={styles.filterSelectorSlot}
                haptic="none"
                onPress={() =>
                  setActiveFilterMenu((currentValue) =>
                    currentValue === 'type' ? null : 'type',
                  )
                }
              >
                <View style={styles.filterSelector}>
                  <AppText variant="micro" color={AppColors.textMuted}>
                    {formatSecondaryFilterLabel(filterType)}
                  </AppText>
                  <Ionicons
                    name={activeFilterMenu === 'type' ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={AppColors.textMuted}
                  />
                </View>
              </PressScale>
              <PressScale
                containerStyle={styles.customActionSlot}
                haptic="none"
                onPress={onCreateCustom}>
                <View style={styles.createCustomCompactButton}>
                  <Ionicons name="add-circle-outline" size={18} color={AppColors.primary} />
                  <AppText variant="micro" color={AppColors.primary}>
                    add custom exercise
                  </AppText>
                </View>
              </PressScale>
            </View>
            {activeFilterMenu ? (
              <View style={styles.filterDropdownPanel}>
                <View style={styles.filterDropdownWrap}>
                  {(activeFilterMenu === 'group'
                    ? EXERCISE_FILTER_GROUPS
                    : EXERCISE_FILTER_TYPES
                  ).map((value) => (
                    <FilterChip
                      key={value}
                      active={
                        activeFilterMenu === 'group'
                          ? filterGroup === value
                          : filterType === value
                      }
                      label={formatFilterLabel(value)}
                      onPress={() => {
                        if (activeFilterMenu === 'group') {
                          setFilterGroup(value as ExerciseFilterGroup);
                        } else {
                          setFilterType(value as ExerciseFilterType);
                        }
                        setActiveFilterMenu(null);
                      }}
                    />
                  ))}
                </View>
              </View>
            ) : null}
            <ScrollView
              style={styles.optionScroll}
              contentContainerStyle={styles.optionList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {exerciseOptions.length === 0 ? (
                <SurfaceCard style={styles.emptyExerciseCard}>
                  <AppText variant="bodyStrong">No exercises match yet</AppText>
                  <AppText variant="micro" dimmed>
                    try another search or add a custom exercise.
                  </AppText>
                </SurfaceCard>
              ) : null}
              {exerciseOptions.map((exercise) => (
                <PressScale
                  key={exercise.id}
                  containerStyle={styles.optionPressable}
                  haptic="none"
                  onPress={() => onSelect(exercise)}
                >
                  <View
                    style={[
                      styles.optionMain,
                      pickerMode === 'add' && selectedExerciseIds.includes(exercise.id)
                        ? styles.optionMainSelected
                        : null,
                    ]}
                  >
                    {getExerciseLibraryImageSource(exercise) ? (
                      <Image
                        source={getExerciseLibraryImageSource(exercise)}
                        style={styles.optionImage}
                        autoplay={false}
                        contentFit="contain"
                      />
                    ) : (
                      <View style={styles.optionImageFallback}>
                        <Ionicons name="barbell-outline" size={18} color={AppColors.primary} />
                      </View>
                    )}
                    <View style={styles.optionCopy}>
                      <AppText variant="bodyStrong" numberOfLines={1}>
                        {exercise.name}
                      </AppText>
                      <AppText variant="micro" dimmed numberOfLines={2}>
                        {formatExerciseLibraryMeta(exercise)}
                      </AppText>
                    </View>
                    {pickerMode === 'add' ? (
                      <View
                        style={[
                          styles.optionCheck,
                          selectedExerciseIds.includes(exercise.id)
                            ? styles.optionCheckSelected
                            : null,
                        ]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={
                            selectedExerciseIds.includes(exercise.id)
                              ? AppColors.white
                              : AppColors.textSubtle
                          }
                        />
                      </View>
                    ) : null}
                  </View>
                </PressScale>
              ))}
            </ScrollView>
          </SurfaceCard>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function ExerciseComposerModal({
  draft,
  isOpen,
  onChange,
  onClose,
  onSave,
}: {
  draft: ExerciseComposerDraft;
  isOpen: boolean;
  onChange: (draft: ExerciseComposerDraft) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={isOpen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.modalRoot}>
        <PressScale containerStyle={styles.modalBackdrop} haptic="none" onPress={onClose}>
          <View />
        </PressScale>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <SurfaceCard style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <AppText variant="title">Custom exercise</AppText>
              <PressScale haptic="none" onPress={onClose}>
                <View style={styles.headerButton}>
                  <Ionicons name="close" size={18} color={AppColors.text} />
                </View>
              </PressScale>
            </View>

            <ExerciseInputField
              label="Exercise name"
              onChangeText={(value) => onChange({ ...draft, name: value })}
              value={draft.name}
            />

            <View style={styles.modeRow}>
              <TrackingModeChip
                label="Strength"
                onPress={() => onChange({ ...draft, trackingMode: 'strength' })}
                selected={draft.trackingMode === 'strength'}
              />
              <TrackingModeChip
                label="Duration"
                onPress={() => onChange({ ...draft, trackingMode: 'duration' })}
                selected={draft.trackingMode === 'duration'}
              />
            </View>

            {draft.trackingMode === 'duration' ? (
              <ExerciseInputField
                keyboardType="number-pad"
                label="Duration per set"
                onChangeText={(value) =>
                  onChange({ ...draft, durationMinutes: formatDurationInput(value) })
                }
                value={draft.durationMinutes}
              />
            ) : null}

            <ActionButton label="Save exercise" onPress={onSave} />
          </SurfaceCard>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function ExerciseActionModal({
  isOpen,
  onClose,
  onRemove,
  onReplace,
}: {
  isOpen: boolean;
  onClose: () => void;
  onRemove: () => void;
  onReplace: () => void;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={isOpen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.modalRoot}>
        <PressScale containerStyle={styles.modalBackdrop} haptic="none" onPress={onClose}>
          <View />
        </PressScale>
        <View style={styles.centerModalContainer}>
          <SurfaceCard style={styles.smallActionModalCard}>
            <PressScale haptic="none" onPress={onReplace}>
              <View style={styles.smallActionModalButton}>
                <AppText variant="label">Replace exercise</AppText>
              </View>
            </PressScale>
            <PressScale haptic="none" onPress={onRemove}>
              <View style={styles.smallActionModalButton}>
                <AppText variant="label" color={AppColors.danger}>
                  Remove exercise
                </AppText>
              </View>
            </PressScale>
          </SurfaceCard>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function SetTypeModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: WorkoutSetType) => void;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={isOpen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.modalRoot}>
        <PressScale containerStyle={styles.modalBackdrop} haptic="none" onPress={onClose}>
          <View />
        </PressScale>
        <View style={styles.centerModalContainer}>
          <SurfaceCard style={styles.smallActionModalCard}>
            {SET_TYPE_OPTIONS.map((option) => (
              <PressScale
                key={option.value}
                haptic="none"
                onPress={() => onSelect(option.value)}
              >
                <View style={styles.smallActionModalButton}>
                  <AppText
                    variant="bodyStrong"
                    color={option.tone}
                    style={styles.setTypeOptionCode}
                  >
                    {option.shortLabel || '•'}
                  </AppText>
                  <AppText variant="label">{option.label}</AppText>
                </View>
              </PressScale>
            ))}
          </SurfaceCard>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function ExerciseInputField({
  keyboardType = 'default',
  label,
  onChangeText,
  value,
}: {
  keyboardType?: 'default' | 'number-pad' | 'numbers-and-punctuation';
  label: string;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.inputField}>
      <AppText variant="micro" dimmed>
        {label}
      </AppText>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholderTextColor={AppColors.textSubtle}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function TrackingModeChip({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <PressScale haptic="none" onPress={onPress}>
      <View
        style={[
          styles.modeChip,
          selected ? styles.modeChipSelected : null,
        ]}
      >
        <AppText variant="label" color={selected ? AppColors.white : AppColors.textMuted}>
          {label}
        </AppText>
      </View>
    </PressScale>
  );
}

function FilterChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <PressScale haptic="none" onPress={onPress}>
      <View style={[styles.filterChip, active ? styles.filterChipActive : null]}>
        <AppText
          variant="micro"
          color={active ? AppColors.white : AppColors.textMuted}
        >
          {label}
        </AppText>
      </View>
    </PressScale>
  );
}

function getSetTypeBadgeLabel(setRow: ActiveWorkoutSetView) {
  if (setRow.setType === 'warmup') {
    return 'W';
  }

  if (setRow.setType === 'drop') {
    return 'D';
  }

  if (setRow.setType === 'failure') {
    return 'F';
  }

  return String(setRow.setNumber);
}

function getSetTypeColor(setType: WorkoutSetType, completed: boolean) {
  if (setType === 'warmup') {
    return '#D58C2F';
  }

  if (setType === 'drop') {
    return '#7B3AED';
  }

  if (setType === 'failure') {
    return AppColors.danger;
  }

  return completed ? AppColors.primary : AppColors.textMuted;
}

function getSetTypeBackground(setType: WorkoutSetType, completed: boolean) {
  if (completed && setType === 'normal') {
    return '#EAF1F8';
  }

  if (setType === 'warmup') {
    return 'rgba(213, 140, 47, 0.18)';
  }

  if (setType === 'drop') {
    return 'rgba(123, 58, 237, 0.16)';
  }

  if (setType === 'failure') {
    return 'rgba(231, 100, 92, 0.16)';
  }

  return AppColors.surfaceLowest;
}

function formatWorkoutDate(startedAt: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(startedAt));
}

function formatPreviousSetText(exercise: ActiveWorkoutExerciseView) {
  const trimmedValue = exercise.previousLoadLabel.trim();

  if (!trimmedValue || trimmedValue === 'No previous workout') {
    return '------';
  }

  if (/^0\s*(lb|min)/i.test(trimmedValue)) {
    return '------';
  }

  return trimmedValue;
}

function formatExerciseLibraryMeta(exercise: ExerciseLibraryEntry) {
  const parts = [
    exercise.bodyPart,
    exercise.target,
    exercise.equipment,
    exercise.secondaryMuscles[0],
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' • ').toLowerCase() : exercise.focus.toLowerCase();
}

function getExerciseSearchScore(exercise: ExerciseLibraryEntry, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedName = exercise.name.toLowerCase();
  const normalizedBodyPart = exercise.bodyPart?.toLowerCase() ?? '';
  const normalizedTarget = exercise.target?.toLowerCase() ?? '';
  const normalizedCategory = exercise.category?.toLowerCase() ?? '';
  const normalizedEquipment = exercise.equipment?.toLowerCase() ?? '';
  const normalizedAliases = exercise.aliases.map((alias) => alias.toLowerCase());
  const normalizedSecondaryMuscles = exercise.secondaryMuscles.map((muscle) =>
    muscle.toLowerCase(),
  );

  let score = 0;

  if (normalizedName === normalizedQuery) score += 12;
  if (normalizedAliases.includes(normalizedQuery)) score += 10;
  if (normalizedTarget === normalizedQuery) score += 9;
  if (normalizedBodyPart === normalizedQuery) score += 9;
  if (normalizedCategory === normalizedQuery) score += 8;
  if (normalizedEquipment === normalizedQuery) score += 6;
  if (normalizedName.startsWith(normalizedQuery)) score += 5;
  if (normalizedAliases.some((alias) => alias.startsWith(normalizedQuery))) score += 4;
  if (normalizedSecondaryMuscles.includes(normalizedQuery)) score += 3;
  if (normalizedName.includes(normalizedQuery)) score += 2;

  return score;
}

function formatFilterLabel(value: string) {
  if (value === 'all') {
    return 'all';
  }

  if (value === 'bodyweight') {
    return 'bodyweight';
  }

  return value;
}

function formatPrimaryFilterLabel(value: ExerciseFilterGroup) {
  return value === 'all' ? 'any body part' : formatFilterLabel(value);
}

function formatSecondaryFilterLabel(value: ExerciseFilterType) {
  return value === 'all' ? 'any category' : formatFilterLabel(value);
}

function getExerciseFilterGroup(exercise: ExerciseLibraryEntry): ExerciseFilterGroup {
  const bodyPart = exercise.bodyPart?.toLowerCase() ?? '';

  if (bodyPart === 'waist') return 'core';
  if (bodyPart === 'upper arms' || bodyPart === 'lower arms') return 'arms';
  if (bodyPart === 'back') return 'back';
  if (bodyPart === 'chest') return 'chest';
  if (bodyPart === 'upper legs' || bodyPart === 'lower legs') return 'legs';
  if (bodyPart === 'shoulders') return 'shoulders';
  if (bodyPart === 'cardio') return 'cardio';

  return 'other';
}

function getExerciseFilterType(exercise: ExerciseLibraryEntry): ExerciseFilterType {
  const equipment = exercise.equipment?.toLowerCase() ?? '';
  const category = exercise.category?.toLowerCase() ?? '';
  const bodyPart = exercise.bodyPart?.toLowerCase() ?? '';

  if (bodyPart === 'cardio' || category === 'cardio') {
    return 'cardio';
  }

  if (equipment.includes('barbell')) {
    return 'barbell';
  }

  if (equipment.includes('dumbbell')) {
    return 'dumbbell';
  }

  if (equipment.includes('body weight')) {
    return 'bodyweight';
  }

  if (
    equipment.includes('machine') ||
    equipment.includes('assisted') ||
    equipment.includes('sled') ||
    equipment.includes('smith')
  ) {
    return 'machine';
  }

  return 'all';
}

function matchesExerciseFilterGroup(
  exercise: ExerciseLibraryEntry,
  filterGroup: ExerciseFilterGroup,
) {
  return filterGroup === 'all' || getExerciseFilterGroup(exercise) === filterGroup;
}

function matchesExerciseFilterType(
  exercise: ExerciseLibraryEntry,
  filterType: ExerciseFilterType,
) {
  return filterType === 'all' || getExerciseFilterType(exercise) === filterType;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    paddingHorizontal: Layout.pagePadding,
    paddingTop: Spacing.md,
    paddingBottom: 6,
    backgroundColor: AppColors.background,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceLowest,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  titleInput: {
    paddingVertical: 0,
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.text,
    letterSpacing: -0.35,
    lineHeight: 24,
  },
  finishButton: {
    minHeight: 38,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
    ...Shadows.soft,
  },
  timerPill: {
    minHeight: 30,
    borderRadius: Radii.pill,
    paddingHorizontal: 10,
    backgroundColor: AppColors.surfaceLowest,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scrollContent: {
    paddingHorizontal: Layout.pagePadding,
    paddingBottom: 64,
    paddingTop: 14,
    gap: 10,
  },
  emptyStateWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Layout.pagePadding,
  },
  emptyCard: {
    gap: Spacing.md,
  },
  emptyExerciseCard: {
    gap: Spacing.xs,
  },
  exerciseCard: {
    gap: 4,
    overflow: 'visible',
    padding: 10,
  },
  exerciseCardOverlayActive: {
    zIndex: 60,
    elevation: 10,
  },
  exerciseCardCompleted: {
    backgroundColor: '#EAF1F8',
  },
  exerciseCardCelebrating: {
    borderWidth: 1,
    borderColor: AppColors.primaryContainer,
  },
  exerciseHeader: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  exerciseHeaderCopy: {
    flex: 1,
    paddingTop: 2,
  },
  exerciseHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreButton: {
    width: 30,
    height: 30,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceLow,
  },
  addSetHeaderButton: {
    minHeight: 30,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.surfaceLow,
  },
  exercisePopover: {
    position: 'absolute',
    top: 34,
    right: 0,
    width: 168,
    borderRadius: Radii.lg,
    padding: Spacing.xs,
    backgroundColor: AppColors.surfaceLowest,
    ...Shadows.soft,
    zIndex: 70,
  },
  exercisePopoverAction: {
    minHeight: 40,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  setRows: {
    gap: 6,
  },
  setNumberHeader: {
    width: 32,
    textAlign: 'center',
  },
  setPreviousHeader: {
    width: 88,
  },
  setInputHeader: {
    flex: 1,
    textAlign: 'center',
  },
  setInputHeaderWide: {
    flex: 1,
    textAlign: 'center',
  },
  setActionSpacer: {
    width: 40,
  },
  setRowWrap: {
    position: 'relative',
    zIndex: 1,
  },
  setRowWrapActive: {
    zIndex: 80,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radii.lg,
    paddingHorizontal: 6,
    paddingVertical: 5,
    backgroundColor: AppColors.surfaceLow,
  },
  setRowCompleted: {
    backgroundColor: '#E2ECF7',
  },
  setNumberCell: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    borderRadius: Radii.md,
    backgroundColor: AppColors.surfaceLowest,
  },
  setPreviousCell: {
    width: 88,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  setInputPressable: {
    flex: 1,
  },
  setInputShell: {
    minHeight: 32,
    borderRadius: Radii.md,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceLowest,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  setInputShellActive: {
    backgroundColor: '#F2F7FC',
    borderColor: 'rgba(39, 116, 174, 0.26)',
    ...Shadows.soft,
  },
  setInputValue: {
    width: '100%',
    textAlign: 'center',
  },
  durationInput: {
    flex: 1,
  },
  setCheckButton: {
    width: 32,
    minHeight: 32,
    height: 32,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceLowest,
    borderWidth: 1,
    borderColor: AppColors.outlineVariant,
  },
  setCheckButtonCompleted: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  inputBoardWrap: {
    position: 'absolute',
    left: Layout.pagePadding,
    right: Layout.pagePadding,
    bottom: Spacing.sm,
    zIndex: 140,
  },
  inputBoardCard: {
    gap: Spacing.sm,
    paddingTop: 10,
    paddingBottom: Spacing.md,
    paddingHorizontal: 10,
    borderRadius: Radii.xl,
    backgroundColor: AppColors.surfaceLowest,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 12,
  },
  inputBoardBody: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.sm,
  },
  inputBoardKeypad: {
    flex: 1,
    gap: Spacing.xs,
  },
  inputBoardKeypadRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  inputBoardKey: {
    flex: 1,
    minHeight: 58,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceLow,
  },
  inputBoardKeyDisabled: {
    opacity: 0.38,
  },
  inputBoardButtonPressed: {
    opacity: 0.78,
  },
  inputBoardRail: {
    width: 92,
    gap: 10,
  },
  inputBoardRailButton: {
    minHeight: 58,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: AppColors.surfaceLow,
  },
  inputBoardStepperRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputBoardStepperAction: {
    flex: 1,
    minHeight: 58,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F5FA',
  },
  inputBoardNextButton: {
    flex: 1,
    minHeight: 82,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AppColors.primary,
    ...Shadows.soft,
  },
  inputBoardNextButtonPressed: {
    opacity: 0.9,
  },
  deleteSetAction: {
    marginLeft: Spacing.sm,
    width: 96,
    minHeight: 44,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: AppColors.danger,
  },
  setTypePopover: {
    position: 'absolute',
    top: 38,
    left: 0,
    width: 164,
    borderRadius: Radii.lg,
    padding: Spacing.xs,
    backgroundColor: AppColors.surfaceLowest,
    ...Shadows.soft,
    zIndex: 75,
  },
  setTypeOption: {
    minHeight: 38,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  setTypeOptionCode: {
    minWidth: 14,
    textAlign: 'center',
  },
  listFooterSpacer: {
    height: 16,
  },
  footerButtons: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  inlineDismissLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  inlineDismissBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  cancelWorkoutButton: {
    minHeight: 42,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(231, 100, 92, 0.10)',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 14, 18, 0.44)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '72%',
    gap: Spacing.md,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
  },
  modalCardLarge: {
    height: '88%',
    gap: Spacing.sm,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
  },
  modalHandle: {
    width: 56,
    height: 5,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceHighest,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  modalHeaderLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  headerAddButton: {
    minHeight: 38,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceLow,
  },
  headerAddButtonPlaceholder: {
    width: 56,
  },
  searchField: {
    minHeight: 42,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: AppColors.surfaceLow,
  },
  searchInput: {
    flex: 1,
    color: AppColors.text,
    fontSize: 15,
  },
  filterControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  filterSelectorSlot: {
    flex: 1,
  },
  customActionSlot: {
    minWidth: 164,
  },
  filterSelector: {
    minHeight: 36,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.surfaceLow,
  },
  filterDropdownPanel: {
    borderRadius: Radii.lg,
    padding: Spacing.xs,
    backgroundColor: AppColors.surfaceLowest,
    ...Shadows.soft,
  },
  filterDropdownWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  filterChip: {
    minHeight: 30,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceLow,
  },
  filterChipActive: {
    backgroundColor: AppColors.primary,
  },
  createCustomButton: {
    minHeight: 50,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: AppColors.surfaceLow,
  },
  createCustomCompactButton: {
    minHeight: 36,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: AppColors.surfaceLow,
  },
  optionList: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  optionScroll: {
    flex: 1,
  },
  optionPressable: {
    width: '100%',
  },
  optionMain: {
    minHeight: 64,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: AppColors.surfaceLow,
  },
  optionMainSelected: {
    backgroundColor: '#EAF1F8',
  },
  optionImage: {
    width: 56,
    height: 56,
    borderRadius: Radii.lg,
    backgroundColor: AppColors.surfaceHighest,
  },
  optionImageFallback: {
    width: 56,
    height: 56,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceHighest,
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionCheck: {
    width: 28,
    height: 28,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceLowest,
    borderWidth: 1,
    borderColor: AppColors.outlineVariant,
  },
  optionCheckSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  centerModalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.pagePadding,
  },
  smallActionModalCard: {
    width: '100%',
    maxWidth: 280,
    gap: Spacing.xs,
    borderRadius: Radii.xl,
    ...Shadows.soft,
  },
  smallActionModalButton: {
    minHeight: 42,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inputField: {
    gap: 6,
  },
  input: {
    minHeight: 44,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: AppColors.surfaceLow,
    color: AppColors.text,
    fontSize: 15,
  },
  modeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    zIndex: 1,
  },
  modeChip: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceLow,
  },
  modeChipSelected: {
    backgroundColor: AppColors.primary,
  },
  composerStrengthRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  composerStrengthField: {
    flex: 1,
  },
});
