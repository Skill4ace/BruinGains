import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Keyboard,
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
import { useEffect, useMemo, useRef, useState } from 'react';

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
  LocalAppData,
  WorkoutExerciseDraft,
  WorkoutSetType,
  WorkoutTemplateExerciseDraft,
  WorkoutTrackingMode,
} from '@/types/app-data';

type PickerState = {
  mode: 'add' | 'replace';
  targetExerciseId: string | null;
};

type TemplateEditorSet = {
  durationMinutes: number | null;
  id: string;
  load: number;
  reps: number;
  setNumber: number;
  setType: WorkoutSetType;
};

type TemplateEditorExercise = {
  bodyPart: string | null;
  category: string | null;
  id: string;
  name: string;
  order: number;
  previousLoadLabel: string;
  repRange: string;
  sets: TemplateEditorSet[];
  targetDurationMinutes: number | null;
  trackingMode: WorkoutTrackingMode;
};

const SET_TYPE_OPTIONS: { label: string; shortLabel: string; tone: string; value: WorkoutSetType }[] = [
  { label: 'Regular', shortLabel: '', tone: AppColors.textMuted, value: 'normal' },
  { label: 'Warm-up', shortLabel: 'W', tone: '#D58C2F', value: 'warmup' },
  { label: 'Drop', shortLabel: 'D', tone: '#7B3AED', value: 'drop' },
  { label: 'Failure', shortLabel: 'F', tone: AppColors.danger, value: 'failure' },
];

type WorkoutInputField = 'durationMinutes' | 'load' | 'reps';

type WorkoutInputTarget = {
  exercise: TemplateEditorExercise;
  fallbackValue: number;
  field: WorkoutInputField;
  fieldLabel: string;
  key: string;
  rowKey: string;
  setRow: TemplateEditorSet;
  step: number;
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

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeExerciseName(value: string) {
  return value.trim().toLowerCase();
}

function buildExerciseDefaults(
  state: LocalAppData,
  exerciseName: string,
  trackingMode: WorkoutTrackingMode,
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

function buildRepRangeFromSets(
  sets: TemplateEditorSet[],
  trackingMode: WorkoutTrackingMode,
  targetDurationMinutes: number | null,
) {
  if (trackingMode === 'duration') {
    return `${targetDurationMinutes ?? sets[0]?.durationMinutes ?? 20} min`;
  }

  const reps = sets.map((set) => Math.round(set.reps)).filter((value) => value > 0);

  if (!reps.length) {
    return '8-10 reps';
  }

  const minReps = Math.min(...reps);
  const maxReps = Math.max(...reps);
  return minReps === maxReps ? `${minReps} reps` : `${minReps}-${maxReps} reps`;
}

function createTemplateSet(
  trackingMode: WorkoutTrackingMode,
  setNumber: number,
  values?: Partial<TemplateEditorSet>,
) {
  return {
    durationMinutes:
      trackingMode === 'duration'
        ? values?.durationMinutes ?? 20
        : null,
    id: values?.id ?? createId('template-set'),
    load: trackingMode === 'duration' ? 0 : values?.load ?? 45,
    reps: trackingMode === 'duration' ? 0 : values?.reps ?? 8,
    setNumber,
    setType: values?.setType ?? 'normal',
  } satisfies TemplateEditorSet;
}

function createTemplateExerciseFromDraft(
  state: LocalAppData,
  draft: WorkoutExerciseDraft,
  order: number,
  overrides?: Partial<TemplateEditorExercise>,
) {
  const defaults = buildExerciseDefaults(state, draft.name, draft.trackingMode);
  const targetSets = Math.max(1, draft.targetSets);
  const targetDurationMinutes =
    draft.trackingMode === 'duration' ? draft.targetDurationMinutes ?? 20 : null;
  const sets = Array.from({ length: targetSets }, (_, index) =>
    createTemplateSet(draft.trackingMode, index + 1, {
      durationMinutes: targetDurationMinutes ?? undefined,
      load: draft.currentLoad ?? defaults.currentLoad,
      reps: draft.targetReps ?? defaults.targetReps,
    }),
  );

  return {
    bodyPart: draft.bodyPart ?? null,
    category: draft.category ?? null,
    id: overrides?.id ?? createId('template-exercise'),
    name: draft.name.trim(),
    order,
    previousLoadLabel: defaults.previousLoadLabel,
    repRange: buildRepRangeFromSets(sets, draft.trackingMode, targetDurationMinutes),
    sets,
    targetDurationMinutes,
    trackingMode: draft.trackingMode,
    ...overrides,
  } satisfies TemplateEditorExercise;
}

function buildTemplateExercisesFromState(
  state: LocalAppData,
  templateId: string | null,
) {
  if (!templateId) {
    return [] as TemplateEditorExercise[];
  }

  return state.templateExercises
    .filter((exercise) => exercise.templateId === templateId)
    .sort((left, right) => left.order - right.order)
    .map((exercise) => {
      const exerciseLibraryEntry =
        state.exerciseLibrary.find(
          (entry) => normalizeExerciseName(entry.name) === normalizeExerciseName(exercise.name),
        ) ?? null;
      const sets = state.templateExerciseSets
        .filter((set) => set.templateExerciseId === exercise.id)
        .sort((left, right) => left.setNumber - right.setNumber)
        .map((set) =>
          createTemplateSet(exercise.trackingMode, set.setNumber, {
            durationMinutes: set.durationMinutes ?? exercise.targetDurationMinutes ?? undefined,
            id: set.id,
            load: set.load,
            reps: set.reps,
            setType: set.setType ?? 'normal',
          }),
        );
      const defaults = buildExerciseDefaults(state, exercise.name, exercise.trackingMode);

      return {
        bodyPart: exerciseLibraryEntry?.bodyPart ?? null,
        category: exerciseLibraryEntry?.category ?? null,
        id: exercise.id,
        name: exercise.name,
        order: exercise.order,
        previousLoadLabel: defaults.previousLoadLabel,
        repRange: exercise.repRange,
        sets:
          sets.length > 0
            ? sets
            : [createTemplateSet(exercise.trackingMode, 1, {
                durationMinutes: exercise.targetDurationMinutes ?? undefined,
                load: exercise.currentLoad,
                reps: exercise.targetReps,
              })],
        targetDurationMinutes: exercise.targetDurationMinutes ?? null,
        trackingMode: exercise.trackingMode,
      } satisfies TemplateEditorExercise;
    });
}

export function WorkoutTemplateEditorPreview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const params = useLocalSearchParams<{ templateId?: string }>();
  const { createWorkoutTemplate, state, updateWorkoutTemplate } = useAppData();
  const editingTemplateId = typeof params.templateId === 'string' ? params.templateId : null;
  const editingTemplate = state.workoutTemplates.find(
    (template) => template.id === editingTemplateId,
  ) ?? null;
  const [titleDraft, setTitleDraft] = useState('');
  const [exercises, setExercises] = useState<TemplateEditorExercise[]>([]);
  const [pickerState, setPickerState] = useState<PickerState | null>(null);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [composerContext, setComposerContext] = useState<PickerState | null>(null);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [exerciseFilterGroup, setExerciseFilterGroup] = useState<ExerciseFilterGroup>('all');
  const [exerciseFilterType, setExerciseFilterType] = useState<ExerciseFilterType>('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerDraft, setComposerDraft] = useState<ExerciseComposerDraft>(
    createExerciseComposerDraft(),
  );
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [activeInputKey, setActiveInputKey] = useState<string | null>(null);
  const [replaceInputOnNextKey, setReplaceInputOnNextKey] = useState(false);
  const [inputBoardHeight, setInputBoardHeight] = useState(
    WORKOUT_INPUT_BOARD_DEFAULT_HEIGHT,
  );
  const [activeExerciseAction, setActiveExerciseAction] = useState<{
    exerciseId: string;
    exerciseName: string;
  } | null>(null);
  const [activeSetTypeTarget, setActiveSetTypeTarget] = useState<{
    exerciseId: string;
    rowKey: string;
    setNumber: number;
  } | null>(null);
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});
  const scrollViewRef = useRef<ScrollView | null>(null);
  const scrollOffsetRef = useRef(0);
  const setRowRefs = useRef<Record<string, View | null>>({});

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

  const workoutInputTargets = useMemo<WorkoutInputTarget[]>(
    () =>
      exercises.flatMap((exercise) =>
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
            },
          ];
        }),
      ),
    [exercises],
  );
  const activeInputTarget = useMemo(
    () => workoutInputTargets.find((target) => target.key === activeInputKey) ?? null,
    [activeInputKey, workoutInputTargets],
  );

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    setTitleDraft(editingTemplate?.name ?? 'Template');
    setExercises(buildTemplateExercisesFromState(state, editingTemplateId));
    setDraftValues({});
    setPickerState(null);
    setActiveInputKey(null);
    setReplaceInputOnNextKey(false);
    setActiveExerciseAction(null);
    setActiveSetTypeTarget(null);
  }, [editingTemplate?.name, editingTemplateId, state]);

  useEffect(() => {
    if (activeInputKey && !activeInputTarget) {
      setActiveInputKey(null);
      setReplaceInputOnNextKey(false);
    }
  }, [activeInputKey, activeInputTarget]);

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

  function getSetRowKey(exerciseId: string, setRow: TemplateEditorSet) {
    return setRow.id ?? `${exerciseId}:${setRow.setNumber}`;
  }

  function getDraftKey(
    exerciseId: string,
    rowKey: string,
    field: 'durationMinutes' | 'load' | 'reps',
  ) {
    return `${exerciseId}:${rowKey}:${field}`;
  }

  function getInputValue(
    exerciseId: string,
    rowKey: string,
    field: 'durationMinutes' | 'load' | 'reps',
    fallbackValue: number,
  ) {
    const draftKey = getDraftKey(exerciseId, rowKey, field);
    const draftValue = draftValues[draftKey];

    if (draftValue !== undefined) {
      return draftValue;
    }

    return field === 'durationMinutes'
      ? formatDurationMinutes(fallbackValue)
      : String(fallbackValue);
  }

  function handleDraftChange(
    exerciseId: string,
    rowKey: string,
    field: 'durationMinutes' | 'load' | 'reps',
    value: string,
  ) {
    const draftKey = getDraftKey(exerciseId, rowKey, field);
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

  function applyCommittedValueToExercises(
    currentExercises: TemplateEditorExercise[],
    exerciseId: string,
    setId: string,
    field: WorkoutInputField,
    normalizedValue: number,
  ) {
    return currentExercises.map((exercise) =>
      exercise.id === exerciseId
        ? {
            ...exercise,
            sets: exercise.sets.map((set) =>
              set.id === setId
                ? {
                    ...set,
                    [field]:
                      field === 'durationMinutes' || field === 'load'
                        ? normalizedValue
                        : Math.round(normalizedValue),
                  }
                : set,
            ),
          }
        : exercise,
    );
  }

  function normalizeCommittedDraftValue(
    field: WorkoutInputField,
    rawValue: string | undefined,
    fallbackValue: number,
  ) {
    return rawValue === undefined || rawValue.trim() === ''
      ? fallbackValue
      : field === 'durationMinutes'
        ? parseDurationMinutesInput(rawValue, fallbackValue)
        : Number.parseFloat(rawValue);
  }

  function commitDraftValue(
    exerciseId: string,
    setId: string,
    field: 'durationMinutes' | 'load' | 'reps',
    fallbackValue: number,
  ) {
    const draftKey = getDraftKey(exerciseId, setId, field);
    const rawValue = draftValues[draftKey];
    const normalizedValue = normalizeCommittedDraftValue(field, rawValue, fallbackValue);

    if (normalizedValue === null || !Number.isFinite(normalizedValue) || normalizedValue < 0) {
      setDraftValues((currentValue) => ({
        ...currentValue,
        [draftKey]:
          field === 'durationMinutes'
            ? formatDurationMinutes(fallbackValue)
            : String(fallbackValue),
      }));
      return;
    }

    setExercises((currentValue) =>
      applyCommittedValueToExercises(
        currentValue,
        exerciseId,
        setId,
        field,
        normalizedValue,
      ),
    );
    setDraftValues((currentValue) => ({
      ...currentValue,
      [draftKey]:
        field === 'durationMinutes'
          ? formatDurationMinutes(normalizedValue)
          : String(normalizedValue),
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

    commitDraftValue(target.exercise.id, target.setRow.id, target.field, target.fallbackValue);
  }

  function closeInputBoard(options?: { commit?: boolean }) {
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
    setActiveInputKey(nextTarget.key);
    setReplaceInputOnNextKey(shouldReplaceInputOnOpen(nextTarget));
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

    if (!selectionContext) {
      return;
    }

    setExercises((currentValue) => {
      const nextExercise = createTemplateExerciseFromDraft(
        state,
        draft,
        selectionContext.mode === 'add'
          ? currentValue.length
          : currentValue.find((exercise) => exercise.id === selectionContext.targetExerciseId)?.order ?? currentValue.length,
        selectionContext.mode === 'replace' && selectionContext.targetExerciseId
          ? {
              id: selectionContext.targetExerciseId,
            }
          : undefined,
      );

      if (selectionContext.mode === 'replace' && selectionContext.targetExerciseId) {
        return currentValue
          .map((exercise) =>
            exercise.id === selectionContext.targetExerciseId
              ? { ...nextExercise, order: exercise.order }
              : exercise,
          )
          .sort((left, right) => left.order - right.order);
      }

      return [...currentValue, nextExercise].map((exercise, index) => ({
        ...exercise,
        order: index,
      }));
    });

    setPickerState(null);
    setSelectedExerciseIds([]);
    setComposerContext(null);
    setComposerOpen(false);
    setActiveInputKey(null);
    setReplaceInputOnNextKey(false);
    setActiveExerciseAction(null);
    setActiveSetTypeTarget(null);
  }

  function handleToggleExerciseSelection(exerciseId: string) {
    setSelectedExerciseIds((currentValue) =>
      currentValue.includes(exerciseId)
        ? currentValue.filter((id) => id !== exerciseId)
        : [...currentValue, exerciseId],
    );
  }

  function handleAddSelectedExercises() {
    if (!pickerState || pickerState.mode !== 'add' || selectedExerciseIds.length === 0) {
      return;
    }

    const selectedExercises = exerciseOptions.filter((exercise) =>
      selectedExerciseIds.includes(exercise.id),
    );

    setExercises((currentValue) => {
      const nextExercises = [...currentValue];

      selectedExercises.forEach((exercise) => {
        const trackingMode = inferExerciseTrackingMode(exercise);

        nextExercises.push(
          createTemplateExerciseFromDraft(
            state,
            {
              bodyPart: exercise.bodyPart ?? null,
              category: exercise.category ?? null,
              currentLoad: trackingMode === 'duration' ? 0 : 45,
              name: exercise.name,
              repRange: trackingMode === 'duration' ? '20:00' : '8-10',
              targetDurationMinutes: trackingMode === 'duration' ? 20 : undefined,
              targetReps: trackingMode === 'duration' ? undefined : 8,
              targetSets: 3,
              trackingMode,
            },
            nextExercises.length,
          ),
        );
      });

      return nextExercises.map((exercise, index) => ({ ...exercise, order: index }));
    });

    setPickerState(null);
    setSelectedExerciseIds([]);
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

  function handleSaveCustomExercise() {
    const trimmedName = composerDraft.name.trim();

    if (!trimmedName) {
      return;
    }

    handleSelectExerciseDraft({
      bodyPart: composerDraft.bodyPart || null,
      category: composerDraft.category || null,
      name: trimmedName,
      repRange: '8-10',
      targetReps: 8,
      targetSets: 1,
      trackingMode: 'strength',
    });
  }

  function handleAddSet(exerciseId: string) {
    closeInputBoard();
    setExercises((currentValue) =>
      currentValue.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }

        const lastSet = exercise.sets[exercise.sets.length - 1];
        return {
          ...exercise,
          repRange: buildRepRangeFromSets(
            [
              ...exercise.sets,
              createTemplateSet(exercise.trackingMode, exercise.sets.length + 1, lastSet),
            ],
            exercise.trackingMode,
            exercise.targetDurationMinutes,
          ),
          sets: [
            ...exercise.sets,
            createTemplateSet(exercise.trackingMode, exercise.sets.length + 1, lastSet),
          ],
        };
      }),
    );
  }

  function handleRemoveSet(exerciseId: string, setId: string) {
    closeInputBoard({ commit: false });
    setExercises((currentValue) =>
      currentValue.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }

        const remainingSets = exercise.sets
          .filter((set) => set.id !== setId)
          .map((set, index) => ({
            ...set,
            setNumber: index + 1,
          }));

        const nextSets =
          remainingSets.length > 0
            ? remainingSets
            : [createTemplateSet(exercise.trackingMode, 1)];

        return {
          ...exercise,
          repRange: buildRepRangeFromSets(
            nextSets,
            exercise.trackingMode,
            exercise.targetDurationMinutes,
          ),
          sets: nextSets,
        };
      }),
    );
  }

  function handleSaveTemplate() {
    const trimmedTitle = titleDraft.trim();
    let exercisesToSerialize = exercises;

    if (activeInputTarget) {
      const draftKey = getDraftKey(
        activeInputTarget.exercise.id,
        activeInputTarget.rowKey,
        activeInputTarget.field,
      );
      const rawValue = draftValues[draftKey];
      const normalizedValue = normalizeCommittedDraftValue(
        activeInputTarget.field,
        rawValue,
        activeInputTarget.fallbackValue,
      );

      if (
        normalizedValue !== null &&
        Number.isFinite(normalizedValue) &&
        normalizedValue >= 0
      ) {
        exercisesToSerialize = applyCommittedValueToExercises(
          exercises,
          activeInputTarget.exercise.id,
          activeInputTarget.setRow.id,
          activeInputTarget.field,
          normalizedValue,
        );
        setExercises(exercisesToSerialize);
      }

      setActiveInputKey(null);
      setReplaceInputOnNextKey(false);
    }

    const serializedExercises: WorkoutTemplateExerciseDraft[] = exercisesToSerialize
      .map((exercise) => ({
        bodyPart: exercise.bodyPart,
        category: exercise.category,
        name: exercise.name.trim(),
        repRange: buildRepRangeFromSets(
          exercise.sets,
          exercise.trackingMode,
          exercise.targetDurationMinutes,
        ),
        sets: exercise.sets.map((set, index) => ({
          durationMinutes: set.durationMinutes ?? null,
          load: set.load,
          reps: set.reps,
          setNumber: index + 1,
          setType: set.setType,
        })),
        targetDurationMinutes: exercise.targetDurationMinutes,
        trackingMode: exercise.trackingMode,
      }))
      .filter((exercise) => exercise.name && exercise.sets.length > 0);

    if (!trimmedTitle || serializedExercises.length === 0) {
      return;
    }

    if (editingTemplateId) {
      updateWorkoutTemplate({
        exercises: serializedExercises,
        name: trimmedTitle,
        templateId: editingTemplateId,
      });
    } else {
      createWorkoutTemplate({
        exercises: serializedExercises,
        name: trimmedTitle,
      });
    }

    router.back();
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <PressScale
            haptic="none"
            onPress={() => {
              closeInputBoard();
              router.back();
            }}>
            <View style={styles.headerButton}>
              <Ionicons name="chevron-back" size={18} color={AppColors.text} />
            </View>
          </PressScale>
          <View style={styles.headerCopy}>
            <TextInput
              onFocus={() => closeInputBoard()}
              onChangeText={setTitleDraft}
              placeholder="Template"
              placeholderTextColor={AppColors.textSubtle}
              style={styles.titleInput}
              value={titleDraft}
            />
            <AppText variant="micro" dimmed>
              Template editor
            </AppText>
          </View>
          <PressScale haptic="medium" onPress={handleSaveTemplate}>
            <View style={styles.saveButton}>
              <AppText variant="label" color={AppColors.white}>
                Save
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
        showsVerticalScrollIndicator={false}>
        {exercises.map((exercise) => (
          <SurfaceCard
            key={exercise.id}
            style={[
              styles.exerciseCard,
              activeExerciseAction?.exerciseId === exercise.id ||
              activeSetTypeTarget?.exerciseId === exercise.id ||
              activeInputTarget?.exercise.id === exercise.id
                ? styles.exerciseCardOverlayActive
                : null,
            ]}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseHeaderCopy}>
                <AppText variant="bodyStrong">{exercise.name}</AppText>
              </View>
              <View style={styles.exerciseHeaderActions}>
                <PressScale
                  haptic="light"
                  onPress={() => {
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
                  }}>
                  <View style={styles.moreButton}>
                    <Ionicons name="ellipsis-horizontal" size={16} color={AppColors.text} />
                  </View>
                </PressScale>
                <PressScale haptic="light" onPress={() => handleAddSet(exercise.id)}>
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
                          haptic="light"
                          onPress={() => {
                            closeInputBoard({ commit: false });
                            swipeableRefs.current[rowKey]?.close();
                            if (
                              activeSetTypeTarget?.exerciseId === exercise.id &&
                              activeSetTypeTarget.rowKey === rowKey
                            ) {
                              setActiveSetTypeTarget(null);
                            }
                            handleRemoveSet(exercise.id, setRow.id);
                          }}>
                          <View style={styles.deleteSetAction}>
                            <Ionicons name="trash-outline" size={16} color={AppColors.white} />
                            <AppText variant="micro" color={AppColors.white}>
                              Delete
                            </AppText>
                          </View>
                        </PressScale>
                      )}>
                      <View style={styles.setRow}>
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
                          }}>
                          <View
                            style={[
                              styles.setNumberCell,
                              {
                                backgroundColor: getSetTypeBackground(setRow.setType),
                              },
                            ]}>
                            <AppText
                              variant="label"
                              color={getSetTypeColor(setRow.setType)}>
                              {getSetTypeBadgeLabel(setRow)}
                            </AppText>
                          </View>
                        </PressScale>
                        <View style={styles.setPreviousCell}>
                          <AppText variant="micro" dimmed numberOfLines={1}>
                            {formatPreviousSetText(exercise.previousLoadLabel)}
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
                                openInputTarget(getWorkoutInputKey(exercise.id, rowKey, 'load'))
                              }
                              value={getInputValue(exercise.id, rowKey, 'load', setRow.load)}
                            />
                            <WorkoutSetInput
                              active={
                                activeInputKey ===
                                getWorkoutInputKey(exercise.id, rowKey, 'reps')
                              }
                              onPress={() =>
                                openInputTarget(getWorkoutInputKey(exercise.id, rowKey, 'reps'))
                              }
                              value={getInputValue(exercise.id, rowKey, 'reps', setRow.reps)}
                            />
                          </>
                        )}
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
            bodyPart: exercise.bodyPart ?? null,
            category: exercise.category ?? null,
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
        saveLabel="Save Exercise"
        title="Create New Exercise"
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
            `Remove "${exerciseName}" from this template?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setExercises((currentValue) =>
                    currentValue
                      .filter((exercise) => exercise.id !== exerciseId)
                      .map((exercise, index) => ({ ...exercise, order: index })),
                  );
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
          setExercises((currentValue) =>
            currentValue.map((exercise) =>
              exercise.id === activeSetTypeTarget.exerciseId
                ? {
                    ...exercise,
                    sets: exercise.sets.map((set) =>
                      set.setNumber === activeSetTypeTarget.setNumber
                        ? { ...set, setType: value }
                        : set,
                    ),
                  }
                : exercise,
            ),
          );
          setActiveSetTypeTarget(null);
        }}
      />
    </SafeAreaView>
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
          style={styles.setInputValue}>
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
                      ]}>
                      {isBackspaceKey ? (
                        <Ionicons name="backspace-outline" size={20} color={AppColors.text} />
                      ) : (
                        <AppText
                          variant="title"
                          color={isDisabledKey ? AppColors.textSubtle : AppColors.text}>
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
              ]}>
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
                ]}>
                <Ionicons name="remove" size={18} color={AppColors.primary} />
              </Pressable>
              <Pressable
                hitSlop={8}
                onPress={() => onStep(1)}
                style={({ pressed }) => [
                  styles.inputBoardStepperAction,
                  pressed ? styles.inputBoardButtonPressed : null,
                ]}>
                <Ionicons name="add" size={18} color={AppColors.primary} />
              </Pressable>
            </View>

            <Pressable
              hitSlop={8}
              onPress={onNext}
              style={({ pressed }) => [
                styles.inputBoardNextButton,
                pressed ? styles.inputBoardNextButtonPressed : null,
              ]}>
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
              <PressScale key={option.value} haptic="none" onPress={() => onSelect(option.value)}>
                <View style={styles.smallActionModalButton}>
                  <AppText
                    variant="bodyStrong"
                    color={option.tone}
                    style={styles.setTypeOptionCode}>
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

function getSetTypeBadgeLabel(setRow: TemplateEditorSet) {
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

function getSetTypeColor(setType: WorkoutSetType) {
  if (setType === 'warmup') {
    return '#D58C2F';
  }

  if (setType === 'drop') {
    return '#7B3AED';
  }

  if (setType === 'failure') {
    return AppColors.danger;
  }

  return AppColors.textMuted;
}

function getSetTypeBackground(setType: WorkoutSetType) {
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

function formatPreviousSetText(previousLoadLabel: string) {
  const trimmedValue = previousLoadLabel.trim();

  if (!trimmedValue || trimmedValue === 'No previous workout') {
    return '------';
  }

  if (/^0\s*(lb|min)/i.test(trimmedValue)) {
    return '------';
  }

  return trimmedValue;
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
  saveButton: {
    minHeight: 38,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
    ...Shadows.soft,
  },
  scrollContent: {
    paddingHorizontal: Layout.pagePadding,
    paddingBottom: 64,
    paddingTop: 14,
    gap: 10,
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
  setInput: {
    flex: 1,
    minHeight: 32,
    borderRadius: Radii.md,
    paddingHorizontal: 8,
    backgroundColor: AppColors.surfaceLowest,
    color: AppColors.text,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
  durationInput: {
    flex: 1,
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
  listFooterSpacer: {
    height: 16,
  },
  footerButtons: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
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
  setTypeOptionCode: {
    minWidth: 14,
    textAlign: 'center',
  },
  emptyExerciseCard: {
    gap: Spacing.xs,
  },
});
