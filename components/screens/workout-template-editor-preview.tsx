import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  getExerciseLibraryImageSource,
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
  ExerciseLibraryEntry,
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
  name: string;
  trackingMode: WorkoutTrackingMode;
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
  id: string;
  name: string;
  order: number;
  previousLoadLabel: string;
  repRange: string;
  sets: TemplateEditorSet[];
  targetDurationMinutes: number | null;
  trackingMode: WorkoutTrackingMode;
};

const DEFAULT_COMPOSER_DRAFT: ExerciseComposerDraft = {
  durationMinutes: '20:00',
  name: '',
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
  const [composerDraft, setComposerDraft] = useState<ExerciseComposerDraft>(DEFAULT_COMPOSER_DRAFT);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
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
    setActiveExerciseAction(null);
    setActiveSetTypeTarget(null);
  }, [editingTemplate?.name, editingTemplateId, state]);

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
      [draftKey]: field === 'durationMinutes' ? formatDurationInput(value) : value,
    }));
  }

  function commitDraftValue(
    exerciseId: string,
    setId: string,
    field: 'durationMinutes' | 'load' | 'reps',
    fallbackValue: number,
  ) {
    const draftKey = getDraftKey(exerciseId, setId, field);
    const rawValue = draftValues[draftKey];
    const normalizedValue =
      rawValue === undefined || rawValue.trim() === ''
        ? fallbackValue
        : field === 'durationMinutes'
          ? parseDurationMinutesInput(rawValue, fallbackValue)
          : Number.parseFloat(rawValue);

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
      currentValue.map((exercise) =>
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

  function handleOpenExercisePicker(
    mode: 'add' | 'replace',
    targetExerciseId: string | null = null,
  ) {
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
        nextExercises.push(
          createTemplateExerciseFromDraft(
            state,
            {
              name: exercise.name,
              repRange: '8-10',
              targetReps: 8,
              targetSets: 3,
              trackingMode: 'strength',
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
      ...DEFAULT_COMPOSER_DRAFT,
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
        repRange: formatDurationMinutes(targetDurationMinutes),
        targetDurationMinutes,
        targetSets: 1,
        trackingMode: 'duration',
      });
      return;
    }

    handleSelectExerciseDraft({
      name: trimmedName,
      repRange: '8-10',
      targetReps: 8,
      targetSets: 1,
      trackingMode: 'strength',
    });
  }

  function handleAddSet(exerciseId: string) {
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
    const serializedExercises: WorkoutTemplateExerciseDraft[] = exercises
      .map((exercise) => ({
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
          <PressScale haptic="none" onPress={() => router.back()}>
            <View style={styles.headerButton}>
              <Ionicons name="chevron-back" size={18} color={AppColors.text} />
            </View>
          </PressScale>
          <View style={styles.headerCopy}>
            <TextInput
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {exercises.map((exercise) => (
          <SurfaceCard
            key={exercise.id}
            style={[
              styles.exerciseCard,
              activeExerciseAction?.exerciseId === exercise.id ||
              activeSetTypeTarget?.exerciseId === exercise.id
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
                    style={[
                      styles.setRowWrap,
                      activeSetTypeTarget?.exerciseId === exercise.id &&
                      activeSetTypeTarget.rowKey === rowKey
                        ? styles.setRowWrapActive
                        : null,
                    ]}>
                    <Swipeable
                      ref={(instance) => {
                        swipeableRefs.current[rowKey] = instance;
                      }}
                      friction={2}
                      onSwipeableWillOpen={() => {
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
                            keyboardType="number-pad"
                            onBlur={() =>
                              commitDraftValue(
                                exercise.id,
                                setRow.id,
                                'durationMinutes',
                                setRow.durationMinutes ?? exercise.targetDurationMinutes ?? 20,
                              )
                            }
                            onChangeText={(value) =>
                              handleDraftChange(exercise.id, rowKey, 'durationMinutes', value)
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
                              onBlur={() =>
                                commitDraftValue(exercise.id, setRow.id, 'load', setRow.load)
                              }
                              onChangeText={(value) =>
                                handleDraftChange(exercise.id, rowKey, 'load', value)
                              }
                              value={getInputValue(exercise.id, rowKey, 'load', setRow.load)}
                            />
                            <WorkoutSetInput
                              onBlur={() =>
                                commitDraftValue(exercise.id, setRow.id, 'reps', setRow.reps)
                              }
                              onChangeText={(value) =>
                                handleDraftChange(exercise.id, rowKey, 'reps', value)
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
            onPress={() => handleOpenExercisePicker('add')}
            variant="primary"
          />
        </View>
        <View style={styles.listFooterSpacer} />
      </ScrollView>

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

          handleSelectExerciseDraft({
            currentLoad: 45,
            name: exercise.name,
            repRange: '8-10',
            targetReps: 8,
            targetSets: 3,
            trackingMode: 'strength',
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
  keyboardType = 'numbers-and-punctuation',
  onBlur,
  onChangeText,
  style,
  value,
}: {
  keyboardType?: 'number-pad' | 'numbers-and-punctuation';
  onBlur: () => void;
  onChangeText: (value: string) => void;
  style?: object;
  value: string;
}) {
  return (
    <TextInput
      keyboardType={keyboardType}
      onBlur={onBlur}
      onChangeText={onChangeText}
      placeholder="0:00"
      placeholderTextColor={AppColors.textSubtle}
      style={[styles.setInput, style]}
      value={value}
    />
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
        <KeyboardAvoidingView behavior={undefined} style={styles.modalContainer}>
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
                  haptic="light"
                  onPress={onCommitSelection}
                  pressEffect="opacity"
                  disabled={selectedExerciseIds.length === 0}>
                  <View style={styles.headerAddButton}>
                    <AppText
                      variant="label"
                      color={
                        selectedExerciseIds.length > 0
                          ? AppColors.primary
                          : AppColors.textSubtle
                      }>
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
                }>
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
                }>
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
              {canCreateCustomExercise ? (
                <PressScale containerStyle={styles.customActionSlot} haptic="light" onPress={onCreateCustom}>
                  <View style={styles.createCustomCompactButton}>
                    <Ionicons name="add-circle-outline" size={18} color={AppColors.primary} />
                    <AppText variant="micro" color={AppColors.primary}>
                      add custom exercise
                    </AppText>
                  </View>
                </PressScale>
              ) : null}
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
            <FlatList
              data={exerciseOptions}
              extraData={selectedExerciseIds}
              initialNumToRender={16}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(exercise) => exercise.id}
              maxToRenderPerBatch={24}
              removeClippedSubviews={Platform.OS === 'android'}
              renderItem={({ item: exercise }) => {
                const selected =
                  pickerMode === 'add' && selectedExerciseIds.includes(exercise.id);

                return (
                  <PressScale
                    containerStyle={styles.optionPressable}
                    haptic="light"
                    pressEffect="opacity"
                    onPress={() => onSelect(exercise)}>
                    <View
                      style={[
                        styles.optionMain,
                        selected ? styles.optionMainSelected : null,
                      ]}>
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
                            selected ? styles.optionCheckSelected : null,
                          ]}>
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={selected ? AppColors.white : AppColors.textSubtle}
                          />
                        </View>
                      ) : null}
                    </View>
                  </PressScale>
                );
              }}
              showsVerticalScrollIndicator={false}
              style={styles.optionScroll}
              contentContainerStyle={styles.optionList}
              windowSize={8}
              ListEmptyComponent={
                <SurfaceCard style={styles.emptyExerciseCard}>
                  <AppText variant="bodyStrong">No exercises match yet</AppText>
                  <AppText variant="micro" dimmed>
                    try another search or add a custom exercise.
                  </AppText>
                </SurfaceCard>
              }
            />
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
          style={styles.modalContainer}>
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
      <View style={[styles.modeChip, selected ? styles.modeChipSelected : null]}>
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
        <AppText variant="micro" color={active ? AppColors.white : AppColors.textMuted}>
          {label}
        </AppText>
      </View>
    </PressScale>
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
