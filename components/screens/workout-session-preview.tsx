import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Alert,
  Keyboard,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
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
  type ReactNode,
} from 'react';

import {
  createExerciseComposerDraft,
  ExerciseComposerModal,
  ExercisePickerModal,
  getExerciseSearchScore,
  matchesExerciseFilterGroup,
  matchesExerciseFilterType,
  type ExerciseComposerDraft,
  type ExerciseFilterGroup,
  type ExerciseFilterType,
} from '@/components/workout/exercise-picker-sheet';
import {
  formatWorkoutTimerLabel,
  getActiveWorkoutSessionView,
} from '@/data/local/selectors';
import {
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
import { AppColors, Layout, Radii, Shadows, Spacing, type ThemeColors } from '@/constants/theme';
import { useAppTheme } from '@/providers/theme-provider';
import type {
  ActiveWorkoutExerciseView,
  ActiveWorkoutSessionView,
  ActiveWorkoutSetView,
  WorkoutExerciseDraft,
  WorkoutSetType,
} from '@/types/app-data';

type PickerState = {
  mode: 'add' | 'replace';
  targetExerciseId: string | null;
};

const SET_TYPE_OPTIONS: { label: string; shortLabel: string; tone: string; value: WorkoutSetType }[] = [
  { label: 'Regular', shortLabel: '', tone: AppColors.textMuted, value: 'normal' },
  { label: 'Warm-up', shortLabel: 'W', tone: '#D58C2F', value: 'warmup' },
  { label: 'Drop', shortLabel: 'D', tone: '#7B3AED', value: 'drop' },
  { label: 'Failure', shortLabel: 'F', tone: AppColors.danger, value: 'failure' },
];

type WorkoutInputField = 'durationMinutes' | 'load' | 'reps';

type WorkoutTimingDraft = {
  automaticTiming: boolean;
  endedAt: Date | null;
  startedAt: Date;
};

type WorkoutTimingField = 'end' | 'start';

type TimingWheelItem = {
  label: string;
  value: string;
};

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

function startOfLocalDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function getLocalDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDayKey(value: string) {
  const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10));

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return new Date();
  }

  return new Date(year, month - 1, day);
}

function formatRelativeDateLabel(date: Date, referenceDate: Date) {
  const dateStart = startOfLocalDay(date).getTime();
  const referenceStart = startOfLocalDay(referenceDate).getTime();
  const dayDiff = Math.round((dateStart - referenceStart) / (24 * 60 * 60 * 1000));

  if (dayDiff === 0) {
    return 'Today';
  }

  if (dayDiff === -1) {
    return 'Yesterday';
  }

  if (dayDiff === 1) {
    return 'Tomorrow';
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatWorkoutTimingValue(date: Date, referenceDate: Date) {
  return `${formatRelativeDateLabel(date, referenceDate)}, ${new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)}`;
}

function formatWorkoutTimingDuration(
  startedAt: Date,
  endedAt: Date | null,
  referenceDate: Date,
) {
  const endBoundary = endedAt ?? referenceDate;
  const elapsedSeconds = Math.max(
    Math.floor((endBoundary.getTime() - startedAt.getTime()) / 1000),
    0,
  );
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(elapsedSeconds % 60).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${minutes}:${seconds}`;
  }

  return `${minutes}:${seconds}`;
}

function toTwelveHourParts(date: Date) {
  const hours = date.getHours();

  return {
    hour: String(hours % 12 || 12),
    meridiem: hours >= 12 ? 'PM' : 'AM',
    minute: String(date.getMinutes()).padStart(2, '0'),
  };
}

function setDateToLocalDay(baseDate: Date, dayKey: string) {
  const nextDay = parseLocalDayKey(dayKey);
  const next = new Date(baseDate);
  next.setFullYear(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate());
  return next;
}

function setDateToTwelveHour(baseDate: Date, hourValue: string, meridiem: string) {
  const normalizedHour = Number.parseInt(hourValue, 10);
  const next = new Date(baseDate);
  const hour = normalizedHour % 12 + (meridiem === 'PM' ? 12 : 0);
  next.setHours(hour);
  return next;
}

function clampDate(date: Date, minDate: Date, maxDate: Date) {
  return new Date(
    Math.min(Math.max(date.getTime(), minDate.getTime()), maxDate.getTime()),
  );
}

function createWorkoutTimingDraft(session: ActiveWorkoutSessionView['session']) {
  return {
    automaticTiming: session.endedAt === null,
    startedAt: new Date(session.startedAt),
    endedAt: session.endedAt ? new Date(session.endedAt) : null,
  } satisfies WorkoutTimingDraft;
}

export function WorkoutSessionPreview() {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const {
    addWorkoutExercise,
    addWorkoutExercises,
    addWorkoutSetRow,
    cancelWorkoutSession,
    finishWorkoutSession,
    removeWorkoutExercise,
    removeWorkoutSetRow,
    replaceWorkoutExercise,
    state,
    toggleWorkoutSetCompletion,
    updateWorkoutSessionTiming,
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
    createExerciseComposerDraft(),
  );
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [titleDraft, setTitleDraft] = useState('');
  const [timingModalOpen, setTimingModalOpen] = useState(false);
  const [timingDraft, setTimingDraft] = useState<WorkoutTimingDraft | null>(null);
  const [activeTimingField, setActiveTimingField] = useState<WorkoutTimingField | null>(null);
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

  function shouldReplaceInputOnOpen(target: WorkoutInputTarget) {
    return getTargetInputValue(target).trim().length > 0;
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
    const nextTarget =
      workoutInputTargets.find((target) => target.key === targetKey) ?? null;

    if (activeInputTarget && activeInputTarget.key !== targetKey) {
      commitInputTarget(activeInputTarget);
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveInputKey(targetKey);
    setReplaceInputOnNextKey(nextTarget ? shouldReplaceInputOnOpen(nextTarget) : false);
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
    setReplaceInputOnNextKey(shouldReplaceInputOnOpen(nextTarget));
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
    setPickerState({ mode, targetExerciseId });
  }

  function handleSelectExerciseDraft(draft: WorkoutExerciseDraft) {
    const selectionContext = pickerState ?? composerContext;

    if (!activeWorkout || !selectionContext) {
      return;
    }

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
      ...createExerciseComposerDraft(),
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

    addWorkoutExercises(
      activeWorkout.session.id,
      selectedExercises.map((exercise) => {
        const trackingMode = inferExerciseTrackingMode(exercise);

        return {
          name: exercise.name,
          repRange: trackingMode === 'duration' ? '20:00' : '8-10',
          targetDurationMinutes: trackingMode === 'duration' ? 20 : undefined,
          targetReps: trackingMode === 'duration' ? undefined : 8,
          targetSets: 3,
          trackingMode,
        };
      }),
    );

    setPickerState(null);
    setSelectedExerciseIds([]);
  }

  function handleSaveCustomExercise() {
    const trimmedName = composerDraft.name.trim();

    if (!trimmedName) {
      return;
    }

    handleSelectExerciseDraft({
      name: trimmedName,
      bodyPart: composerDraft.bodyPart || null,
      category: composerDraft.category || null,
      targetSets: 3,
      trackingMode: 'strength',
    });
  }

  function handleOpenTimingModal() {
    if (!activeWorkout) {
      return;
    }

    Keyboard.dismiss();
    closeInputBoard();
    setActiveExerciseAction(null);
    setActiveSetTypeTarget(null);
    setTimingDraft(createWorkoutTimingDraft(activeWorkout.session));
    setActiveTimingField(null);
    setTimingModalOpen(true);
  }

  function handleCloseTimingModal() {
    setTimingModalOpen(false);
    setTimingDraft(null);
    setActiveTimingField(null);
  }

  function handleToggleAutomaticTiming(nextValue: boolean) {
    setTimingDraft((currentValue) => {
      if (!currentValue) {
        return currentValue;
      }

      return {
        ...currentValue,
        automaticTiming: nextValue,
        endedAt: nextValue
          ? null
          : clampDate(
              currentValue.endedAt ?? clock,
              currentValue.startedAt,
              clock,
            ),
      };
    });

    if (nextValue && activeTimingField === 'end') {
      setActiveTimingField(null);
    }
  }

  function updateTimingField(field: WorkoutTimingField, nextDate: Date) {
    setTimingDraft((currentValue) => {
      if (!currentValue) {
        return currentValue;
      }

      if (field === 'start') {
        const maxStartDate = currentValue.automaticTiming
          ? clock
          : currentValue.endedAt ?? clock;
        const nextStartedAt = clampDate(nextDate, addDays(clock, -365), maxStartDate);

        return {
          ...currentValue,
          startedAt: nextStartedAt,
          endedAt:
            currentValue.automaticTiming || currentValue.endedAt === null
              ? currentValue.endedAt
              : clampDate(currentValue.endedAt, nextStartedAt, clock),
        };
      }

      if (currentValue.automaticTiming) {
        return currentValue;
      }

      return {
        ...currentValue,
        endedAt: clampDate(nextDate, currentValue.startedAt, clock),
      };
    });
  }

  function handleSaveTiming() {
    if (!activeWorkout || !timingDraft) {
      return;
    }

    updateWorkoutSessionTiming(activeWorkout.session.id, {
      startedAt: timingDraft.startedAt.toISOString(),
      endedAt:
        timingDraft.automaticTiming || timingDraft.endedAt === null
          ? null
          : timingDraft.endedAt.toISOString(),
    });
    setClock(new Date());
    handleCloseTimingModal();
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
          <HeaderTimer
            onPress={handleOpenTimingModal}
            value={formatWorkoutTimerLabel(
              activeWorkout.session.startedAt,
              clock,
              activeWorkout.session.endedAt,
            )}
          />
          <PressScale haptic="medium" onPress={handleFinishWorkout}>
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
                  haptic="light"
                  onPress={() => {
                    closeInputBoard();
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
                                  AppColors,
                                ),
                              },
                            ]}
                          >
                            <AppText
                              variant="label"
                              color={getSetTypeColor(setRow.setType, setRow.completed, AppColors)}
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
                          haptic="light"
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
            label="Add Exercises"
            onPress={() => {
              closeInputBoard();
              handleOpenExercisePicker('add');
            }}
            variant="primary"
          />
          <PressScale haptic="none" onPress={handleCancelWorkout}>
            <View style={styles.cancelWorkoutButton}>
              <AppText variant="bodyStrong" color={AppColors.danger}>
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
      <WorkoutTimingModal
        activeField={activeTimingField}
        draft={timingDraft}
        isOpen={timingModalOpen}
        onClose={handleCloseTimingModal}
        onFieldChange={setActiveTimingField}
        onSave={handleSaveTiming}
        onToggleAutomaticTiming={handleToggleAutomaticTiming}
        onUpdateField={updateTimingField}
        referenceDate={clock}
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

function WorkoutTimingModal({
  activeField,
  draft,
  isOpen,
  onClose,
  onFieldChange,
  onSave,
  onToggleAutomaticTiming,
  onUpdateField,
  referenceDate,
}: {
  activeField: WorkoutTimingField | null;
  draft: WorkoutTimingDraft | null;
  isOpen: boolean;
  onClose: () => void;
  onFieldChange: (field: WorkoutTimingField | null) => void;
  onSave: () => void;
  onToggleAutomaticTiming: (value: boolean) => void;
  onUpdateField: (field: WorkoutTimingField, nextDate: Date) => void;
  referenceDate: Date;
}) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);

  if (!isOpen || !draft) {
    return null;
  }

  const editableDate =
    activeField === 'end' ? draft.endedAt ?? referenceDate : draft.startedAt;
  const editableParts = toTwelveHourParts(editableDate);
  const minDate =
    activeField === 'end' ? draft.startedAt : addDays(referenceDate, -365);
  const maxDate =
    activeField === 'end'
      ? referenceDate
      : draft.automaticTiming
        ? referenceDate
        : draft.endedAt ?? referenceDate;
  const dayItems: TimingWheelItem[] = [];
  const startDay = startOfLocalDay(minDate);
  const endDay = startOfLocalDay(maxDate);

  for (
    let cursor = new Date(startDay);
    cursor.getTime() <= endDay.getTime();
    cursor = addDays(cursor, 1)
  ) {
    dayItems.push({
      label: formatRelativeDateLabel(cursor, referenceDate),
      value: getLocalDayKey(cursor),
    });
  }

  const hourItems: TimingWheelItem[] = Array.from({ length: 12 }, (_, index) => ({
    label: String(index + 1),
    value: String(index + 1),
  }));
  const minuteItems: TimingWheelItem[] = Array.from({ length: 60 }, (_, index) => ({
    label: String(index).padStart(2, '0'),
    value: String(index).padStart(2, '0'),
  }));
  const meridiemItems: TimingWheelItem[] = [
    { label: 'AM', value: 'AM' },
    { label: 'PM', value: 'PM' },
  ];

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={isOpen}>
      <View style={styles.timingModalScrim}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.timingModalContainer}>
          <View style={styles.timingModalCard}>
            <View style={styles.timingModalHeader}>
              <PressScale haptic="none" onPress={onClose}>
                <View style={styles.timingModalCloseButton}>
                  <Ionicons name="close" size={22} color={AppColors.text} />
                </View>
              </PressScale>
              <AppText color={AppColors.text} style={styles.timingModalTitle} variant="title">
                Adjust Start/End Time
              </AppText>
              <PressScale haptic="none" onPress={onSave} pressEffect="opacity">
                <View style={styles.timingModalSaveButton}>
                  <AppText color={AppColors.primary} style={styles.timingModalSaveLabel} variant="bodyStrong">
                    Save
                  </AppText>
                </View>
              </PressScale>
            </View>

            <View style={styles.timingModalBody}>
              <View style={styles.timingToggleCard}>
                <View style={styles.timingToggleRow}>
                  <View style={styles.timingSectionCopy}>
                    <AppText color={AppColors.text} style={styles.timingSectionTitle} variant="bodyStrong">
                      Automatic Timing
                    </AppText>
                  </View>
                  <Switch
                    ios_backgroundColor={AppColors.surfaceHighest}
                    onValueChange={onToggleAutomaticTiming}
                    thumbColor={AppColors.white}
                    trackColor={{ false: AppColors.surfaceHighest, true: AppColors.primaryContainer }}
                    value={draft.automaticTiming}
                  />
                </View>
              </View>

              <View style={styles.timingSummaryGroup}>
                <TimingSummaryRow
                  disabled
                  label="Duration"
                  value={formatWorkoutTimingDuration(
                    draft.startedAt,
                    draft.automaticTiming ? null : draft.endedAt,
                    referenceDate,
                  )}
                />
                <TimingSummaryRow
                  active={activeField === 'start'}
                  label="Start Time"
                  onPress={() => onFieldChange(activeField === 'start' ? null : 'start')}
                  value={formatWorkoutTimingValue(draft.startedAt, referenceDate)}
                />
                <TimingSummaryRow
                  active={activeField === 'end'}
                  disabled={draft.automaticTiming}
                  label="End Time"
                  onPress={() =>
                    !draft.automaticTiming && onFieldChange(activeField === 'end' ? null : 'end')
                  }
                  value={
                    draft.automaticTiming
                      ? 'Currently Active'
                      : formatWorkoutTimingValue(draft.endedAt ?? referenceDate, referenceDate)
                  }
                />
              </View>

              {activeField ? (
                <View style={styles.timingWheelSection}>
                  <View style={styles.timingWheelHeader}>
                    <AppText color={AppColors.text} variant="bodyStrong">
                      {activeField === 'start' ? 'Edit Start Time' : 'Edit End Time'}
                    </AppText>
                    <PressScale
                      haptic="none"
                      onPress={() => onFieldChange(null)}
                      pressEffect="opacity"
                    >
                      <AppText color={AppColors.primary} variant="bodyStrong">
                        Done
                      </AppText>
                    </PressScale>
                  </View>

                  <View style={styles.timingWheelsRow}>
                    <TimingWheelField label="Day">
                      <TimingWheelPicker
                        items={dayItems}
                        onChange={(value) =>
                          onUpdateField(
                            activeField,
                            clampDate(
                              setDateToLocalDay(editableDate, value),
                              minDate,
                              maxDate,
                            ),
                          )
                        }
                        selectedValue={getLocalDayKey(editableDate)}
                      />
                    </TimingWheelField>
                    <TimingWheelField label="Hour">
                      <TimingWheelPicker
                        items={hourItems}
                        onChange={(value) =>
                          onUpdateField(
                            activeField,
                            clampDate(
                              setDateToTwelveHour(editableDate, value, editableParts.meridiem),
                              minDate,
                              maxDate,
                            ),
                          )
                        }
                        selectedValue={editableParts.hour}
                      />
                    </TimingWheelField>
                    <TimingWheelField label="Min">
                      <TimingWheelPicker
                        items={minuteItems}
                        onChange={(value) => {
                          const next = new Date(editableDate);
                          next.setMinutes(Number.parseInt(value, 10), 0, 0);
                          onUpdateField(activeField, clampDate(next, minDate, maxDate));
                        }}
                        selectedValue={editableParts.minute}
                      />
                    </TimingWheelField>
                    <TimingWheelField label="AM/PM">
                      <TimingWheelPicker
                        items={meridiemItems}
                        onChange={(value) =>
                          onUpdateField(
                            activeField,
                            clampDate(
                              setDateToTwelveHour(editableDate, editableParts.hour, value),
                              minDate,
                              maxDate,
                            ),
                          )
                        }
                        selectedValue={editableParts.meridiem}
                      />
                    </TimingWheelField>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TimingSummaryRow({
  active = false,
  disabled = false,
  label,
  onPress,
  value,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onPress?: () => void;
  value: string;
}) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);

  const content = (
    <View
      style={[
        styles.timingSummaryRow,
        active ? styles.timingSummaryRowActive : null,
        disabled ? styles.timingSummaryRowDisabled : null,
      ]}>
      <View style={styles.timingSummaryCopy}>
        <AppText color={AppColors.textMuted} style={styles.timingSummaryCaption} variant="micro">
          {label}
        </AppText>
        <AppText
          color={disabled ? AppColors.textMuted : AppColors.text}
          style={styles.timingSummaryValue}
          variant="title"
        >
          {value}
        </AppText>
      </View>
      {onPress ? (
        <Ionicons
          color={active ? AppColors.primary : AppColors.textSubtle}
          name={active ? 'chevron-up' : 'chevron-forward'}
          size={18}
        />
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <PressScale haptic="none" onPress={onPress} pressEffect="opacity">
      {content}
    </PressScale>
  );
}

function TimingWheelField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);

  return (
    <View style={styles.timingWheelField}>
      <AppText color={AppColors.textMuted} style={styles.timingWheelLabel} variant="micro">
        {label}
      </AppText>
      {children}
    </View>
  );
}

function TimingWheelPicker({
  items,
  onChange,
  selectedValue,
}: {
  items: TimingWheelItem[];
  onChange: (value: string) => void;
  selectedValue: string;
}) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
  const itemHeight = 34;
  const visibleRows = 5;
  const frameHeight = itemHeight * visibleRows;
  const verticalPadding = (frameHeight - itemHeight) / 2;
  const scrollRef = useRef<ScrollView | null>(null);
  const lastCommittedValueRef = useRef(selectedValue);
  const [centeredValue, setCenteredValue] = useState(selectedValue);
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.value === selectedValue),
  );

  function getIndexForOffset(offsetY: number) {
    return Math.max(0, Math.min(items.length - 1, Math.round(offsetY / itemHeight)));
  }

  function syncCenteredValue(offsetY: number) {
    const nextIndex = getIndexForOffset(offsetY);
    const nextValue = items[nextIndex]?.value;

    if (nextValue && nextValue !== centeredValue) {
      setCenteredValue(nextValue);
    }

    return nextIndex;
  }

  useEffect(() => {
    lastCommittedValueRef.current = selectedValue;
    setCenteredValue(selectedValue);
  }, [selectedValue]);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * itemHeight,
        animated: false,
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [itemHeight, selectedIndex]);

  function commitOffset(offsetY: number, animated: boolean) {
    const nextIndex = syncCenteredValue(offsetY);
    const nextValue = items[nextIndex]?.value;

    if (nextValue && nextValue !== lastCommittedValueRef.current) {
      lastCommittedValueRef.current = nextValue;
      onChange(nextValue);
      void Haptics.selectionAsync();
    }

    scrollRef.current?.scrollTo({
      y: nextIndex * itemHeight,
      animated,
    });
  }

  return (
    <View style={[styles.timingWheelFrame, { height: frameHeight }]}>
      <ScrollView
        bounces={false}
        decelerationRate="fast"
        onMomentumScrollEnd={(event) => {
          commitOffset(event.nativeEvent.contentOffset.y, true);
        }}
        onScroll={(event) => {
          syncCenteredValue(event.nativeEvent.contentOffset.y);
        }}
        onScrollEndDrag={(event) => {
          const velocityY = Math.abs(event.nativeEvent.velocity?.y ?? 0);

          if (velocityY < 0.05) {
            commitOffset(event.nativeEvent.contentOffset.y, true);
          }
        }}
        ref={scrollRef}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        snapToOffsets={items.map((_, index) => index * itemHeight)}
        contentContainerStyle={{ paddingVertical: verticalPadding }}
      >
        {items.map((item) => {
          const selected = item.value === centeredValue;

          return (
            <View key={`${item.value}-${item.label}`} style={[styles.timingWheelRow, { height: itemHeight }]}>
              <AppText
                color={selected ? AppColors.text : AppColors.textSubtle}
                style={styles.timingWheelValue}
                variant={selected ? 'bodyStrong' : 'body'}
              >
                {item.label}
              </AppText>
            </View>
          );
        })}
      </ScrollView>
      <View pointerEvents="none" style={[styles.timingWheelSelectionBand, { height: itemHeight, top: verticalPadding }]} />
    </View>
  );
}

function HeaderTimer({ onPress, value }: { onPress: () => void; value: string }) {
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);

  return (
    <PressScale haptic="none" onPress={onPress} pressEffect="opacity">
      <View style={styles.timerPill}>
        <Ionicons name="time-outline" size={14} color={AppColors.primary} />
        <AppText variant="bodyStrong" color={AppColors.primary}>
          {value}
        </AppText>
      </View>
    </PressScale>
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
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);

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
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);
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
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);

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
  const AppColors = useAppTheme().colors;
  const styles = useMemo(() => createStyles(AppColors), [AppColors]);

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

function getSetTypeColor(setType: WorkoutSetType, completed: boolean, colors: ThemeColors) {
  if (setType === 'warmup') {
    return '#D58C2F';
  }

  if (setType === 'drop') {
    return '#7B3AED';
  }

  if (setType === 'failure') {
    return colors.danger;
  }

  return completed ? colors.primary : colors.textMuted;
}

function getSetTypeBackground(setType: WorkoutSetType, completed: boolean, colors: ThemeColors) {
  if (completed && setType === 'normal') {
    return colors.surfaceVariant;
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

  return colors.surfaceLowest;
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

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      paddingHorizontal: Layout.pagePadding,
      paddingTop: Spacing.md,
      paddingBottom: 6,
      backgroundColor: c.background,
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
      backgroundColor: c.surfaceLowest,
    },
    headerCopy: {
      flex: 1,
      gap: 4,
    },
    titleInput: {
      paddingVertical: 0,
      fontSize: 20,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.35,
      lineHeight: 24,
    },
    finishButton: {
      minHeight: 38,
      borderRadius: Radii.pill,
      paddingHorizontal: Spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
      ...Shadows.soft,
    },
    timerPill: {
      minHeight: 30,
      borderRadius: Radii.pill,
      paddingHorizontal: 10,
      backgroundColor: c.surfaceLowest,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    timingModalBody: {
      gap: Spacing.md,
    },
    timingModalCard: {
      borderRadius: 26,
      backgroundColor: c.surfaceLowest,
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 18,
      gap: Spacing.md,
      ...Shadows.floating,
    },
    timingModalCloseButton: {
      width: 52,
      height: 52,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceVariant,
    },
    timingModalContainer: {
      width: '100%',
      maxWidth: 420,
    },
    timingModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    timingModalSaveButton: {
      minWidth: 52,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    timingModalSaveLabel: {
      fontSize: 15,
      lineHeight: 18,
    },
    timingModalScrim: {
      flex: 1,
      backgroundColor: c.scrim,
      paddingHorizontal: Layout.pagePadding,
      paddingVertical: Spacing.huge,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timingModalTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 16,
      lineHeight: 20,
    },
    timingSectionCopy: {
      flex: 1,
      gap: 2,
    },
    timingSectionTitle: {
      fontSize: 15,
      lineHeight: 18,
    },
    timingSummaryCaption: {
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    timingSummaryCopy: {
      flex: 1,
      gap: 3,
    },
    timingSummaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
      minHeight: 72,
      borderRadius: Radii.lg,
      backgroundColor: c.surfaceVariant,
      borderWidth: 1,
      borderColor: c.outlineVariant,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    timingSummaryRowActive: {
      backgroundColor: 'rgba(39, 116, 174, 0.08)',
      borderColor: 'rgba(39, 116, 174, 0.16)',
    },
    timingSummaryRowDisabled: {
      backgroundColor: c.surfaceLow,
    },
    timingSummaryValue: {
      flex: 1,
      fontSize: 16,
      lineHeight: 20,
    },
    timingSummaryGroup: {
      gap: Spacing.sm,
    },
    timingToggleCard: {
      borderRadius: Radii.lg,
      backgroundColor: c.surfaceVariant,
      borderWidth: 1,
      borderColor: c.outlineVariant,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    timingToggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
    },
    timingWheelField: {
      flex: 1,
      gap: Spacing.sm,
      minWidth: 0,
    },
    timingWheelFrame: {
      borderRadius: 18,
      backgroundColor: c.surfaceVariant,
      overflow: 'hidden',
    },
    timingWheelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
    },
    timingWheelLabel: {
      letterSpacing: 0.6,
    },
    timingWheelRow: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    timingWheelSection: {
      gap: Spacing.md,
      marginTop: Spacing.xs,
      borderTopWidth: 1,
      borderTopColor: c.outlineVariant,
      paddingTop: Spacing.md,
    },
    timingWheelSelectionBand: {
      position: 'absolute',
      left: 6,
      right: 6,
      borderRadius: Radii.md,
      backgroundColor: 'rgba(39, 116, 174, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(39, 116, 174, 0.14)',
    },
    timingWheelsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
    },
    timingWheelValue: {
      textAlign: 'center',
      paddingHorizontal: 2,
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
      backgroundColor: c.surfaceVariant,
    },
    exerciseCardCelebrating: {
      borderWidth: 1,
      borderColor: c.primaryContainer,
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
      backgroundColor: c.surfaceLow,
    },
    addSetHeaderButton: {
      minHeight: 30,
      borderRadius: Radii.pill,
      paddingHorizontal: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: c.surfaceLow,
    },
    exercisePopover: {
      position: 'absolute',
      top: 34,
      right: 0,
      width: 168,
      borderRadius: Radii.lg,
      padding: Spacing.xs,
      backgroundColor: c.surfaceLowest,
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
      backgroundColor: c.surfaceLow,
    },
    setRowCompleted: {
      backgroundColor: c.surfaceVariant,
    },
    setNumberCell: {
      width: 32,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 32,
      borderRadius: Radii.md,
      backgroundColor: c.surfaceLowest,
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
      backgroundColor: c.surfaceLowest,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    setInputShellActive: {
      backgroundColor: c.surfaceVariant,
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
      backgroundColor: c.surfaceLowest,
      borderWidth: 1,
      borderColor: c.outlineVariant,
    },
    setCheckButtonCompleted: {
      backgroundColor: c.primary,
      borderColor: c.primary,
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
      backgroundColor: c.surfaceLowest,
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
      backgroundColor: c.surfaceLow,
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
      backgroundColor: c.surfaceLow,
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
      backgroundColor: c.surfaceVariant,
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
      backgroundColor: c.primary,
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
      backgroundColor: c.danger,
    },
    setTypePopover: {
      position: 'absolute',
      top: 38,
      left: 0,
      width: 164,
      borderRadius: Radii.lg,
      padding: Spacing.xs,
      backgroundColor: c.surfaceLowest,
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
      minHeight: 50,
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
    composerScrim: {
      flex: 1,
      backgroundColor: 'rgba(11, 14, 18, 0.44)',
      padding: Spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    composerAvoidingView: {
      width: '100%',
      maxWidth: 420,
    },
    composerCard: {
      backgroundColor: c.surfaceLowest,
      borderRadius: Radii.xl,
      padding: 24,
      paddingBottom: 40,
      gap: 20,
      overflow: 'visible',
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
      backgroundColor: c.surfaceHighest,
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
    modalHeaderTrailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    headerCustomButton: {
      minHeight: 34,
      borderRadius: Radii.pill,
      paddingHorizontal: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: c.surfaceLow,
    },
    headerAddButton: {
      minHeight: 34,
      borderRadius: Radii.pill,
      paddingHorizontal: Spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceLow,
    },
    searchField: {
      minHeight: 42,
      borderRadius: Radii.lg,
      paddingHorizontal: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.surfaceLow,
    },
    searchInput: {
      flex: 1,
      color: c.text,
      fontSize: 15,
    },
    filterControlRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    filterSelectorSlot: {
      flex: 1,
      position: 'relative',
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
      backgroundColor: c.surfaceLow,
    },
    filterDropdownMenu: {
      position: 'absolute',
      top: '100%',
      left: 0,
      minWidth: 160,
      marginTop: Spacing.xs,
      borderRadius: Radii.md,
      backgroundColor: c.surfaceLowest,
      borderWidth: 1,
      borderColor: c.outlineVariant,
      overflow: 'hidden',
      ...Shadows.soft,
      zIndex: 20,
    },
    filterDropdownScroll: {
      maxHeight: 220,
    },
    filterDropdownOption: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
    },
    filterDropdownOptionActive: {
      backgroundColor: c.surfaceLow,
    },
    filterChip: {
      minHeight: 30,
      borderRadius: Radii.pill,
      paddingHorizontal: Spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceLow,
    },
    filterChipActive: {
      backgroundColor: c.primary,
    },
    createCustomButton: {
      minHeight: 50,
      borderRadius: Radii.lg,
      paddingHorizontal: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.surfaceLow,
    },
    createCustomCompactButton: {
      minHeight: 36,
      borderRadius: Radii.lg,
      paddingHorizontal: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      backgroundColor: c.surfaceLow,
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
      backgroundColor: c.surfaceLow,
    },
    optionMainSelected: {
      backgroundColor: c.surfaceVariant,
    },
    optionImage: {
      width: 56,
      height: 56,
      borderRadius: Radii.lg,
      backgroundColor: c.surfaceHighest,
    },
    optionImageFallback: {
      width: 56,
      height: 56,
      borderRadius: Radii.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceHighest,
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
      backgroundColor: c.surfaceLowest,
      borderWidth: 1,
      borderColor: c.outlineVariant,
    },
    optionCheckSelected: {
      backgroundColor: c.primary,
      borderColor: c.primary,
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
      backgroundColor: c.surfaceLow,
      color: c.text,
      fontSize: 15,
    },
    composerDropdownWrapper: {
      position: 'relative',
    },
    composerDropdownTrigger: {
      borderRadius: Radii.lg,
      backgroundColor: c.surfaceLow,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      gap: Spacing.xs,
    },
    composerDropdownValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    composerDropdownMenu: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: Spacing.xs,
      backgroundColor: c.surfaceLowest,
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: c.outlineVariant,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
      overflow: 'hidden',
    },
    composerDropdownScroll: {
      maxHeight: 220,
    },
    composerDropdownOptionRow: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
    },
    composerDropdownOptionSelected: {
      backgroundColor: c.surfaceLow,
    },
  });
}
