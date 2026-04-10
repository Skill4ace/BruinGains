import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
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
import {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  formatWorkoutTimerLabel,
  getActiveWorkoutSessionView,
} from '@/data/local/selectors';
import { useAppData } from '@/providers/app-data-provider';
import { ActionButton } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';
import { SurfaceCard } from '@/components/ui/surface-card';
import { AppColors, Layout, Radii, Shadows, Spacing } from '@/constants/theme';
import type {
  ActiveWorkoutExerciseView,
  ActiveWorkoutSetView,
  WorkoutExerciseDraft,
  WorkoutSetType,
  WorkoutTrackingMode,
} from '@/types/app-data';

type PickerState = {
  mode: 'add' | 'replace';
  targetExerciseId: string | null;
};

type ExerciseComposerDraft = {
  durationMinutes: string;
  load: string;
  name: string;
  repRange: string;
  reps: string;
  targetSets: string;
  trackingMode: WorkoutTrackingMode;
};

const DEFAULT_COMPOSER_DRAFT: ExerciseComposerDraft = {
  durationMinutes: '20',
  load: '45',
  name: '',
  repRange: '8-10',
  reps: '8',
  targetSets: '3',
  trackingMode: 'strength',
};

const SET_TYPE_OPTIONS: { label: string; shortLabel: string; tone: string; value: WorkoutSetType }[] = [
  { label: 'Regular', shortLabel: '', tone: AppColors.textMuted, value: 'normal' },
  { label: 'Warm-up', shortLabel: 'W', tone: '#D58C2F', value: 'warmup' },
  { label: 'Drop', shortLabel: 'D', tone: '#7B3AED', value: 'drop' },
  { label: 'Failure', shortLabel: 'F', tone: AppColors.danger, value: 'failure' },
];

export function WorkoutSessionPreview() {
  const router = useRouter();
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
  const [activeMenuExerciseId, setActiveMenuExerciseId] = useState<string | null>(null);
  const [pickerState, setPickerState] = useState<PickerState | null>(null);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerDraft, setComposerDraft] = useState<ExerciseComposerDraft>(
    DEFAULT_COMPOSER_DRAFT,
  );
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [titleDraft, setTitleDraft] = useState('');
  const [celebratingExerciseId, setCelebratingExerciseId] = useState<string | null>(null);
  const [activeSetTypeTarget, setActiveSetTypeTarget] = useState<{
    exerciseId: string;
    rowKey: string;
  } | null>(null);
  const previousCompletionMapRef = useRef<Record<string, boolean>>({});
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});
  const completedSetCount = useMemo(
    () =>
      activeWorkout?.exercises.reduce(
        (total, exercise) => total + exercise.completedSets,
        0,
      ) ?? 0,
    [activeWorkout],
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

  const exerciseOptions = useMemo(() => {
    const optionNames = new Set<string>();

    state.exerciseLibrary.forEach((exercise) => {
      if (exercise.name.trim()) {
        optionNames.add(exercise.name.trim());
      }
    });

    state.templateExercises.forEach((exercise) => {
      if (exercise.name.trim()) {
        optionNames.add(exercise.name.trim());
      }
    });

    return [...optionNames].sort((left, right) => left.localeCompare(right));
  }, [state.exerciseLibrary, state.templateExercises]);

  const filteredExerciseOptions = useMemo(() => {
    const query = exerciseSearchQuery.trim().toLowerCase();

    if (!query) {
      return exerciseOptions;
    }

    return exerciseOptions.filter((exerciseName) =>
      exerciseName.toLowerCase().includes(query),
    );
  }, [exerciseOptions, exerciseSearchQuery]);

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
    return draftValues[draftKey] ?? String(fallbackValue);
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
      [draftKey]: value,
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
        : Number.parseFloat(rawValue);

    if (Number.isFinite(normalizedValue) && normalizedValue >= 0) {
      updateWorkoutSetValue(exercise.id, setRow.setNumber, field, normalizedValue);
      setDraftValues((currentValue) => ({
        ...currentValue,
        [draftKey]: String(normalizedValue),
      }));
      return;
    }

    setDraftValues((currentValue) => ({
      ...currentValue,
      [draftKey]: String(fallbackValue),
    }));
  }

  function handleToggleSet(
    exercise: ActiveWorkoutExerciseView,
    setRow: ActiveWorkoutSetView,
  ) {
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
    setExerciseSearchQuery('');
    setActiveMenuExerciseId(null);
    setActiveSetTypeTarget(null);
    setPickerState({ mode, targetExerciseId });
  }

  function handleSelectExerciseDraft(draft: WorkoutExerciseDraft) {
    if (!activeWorkout || !pickerState) {
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (pickerState.mode === 'add') {
      addWorkoutExercise(activeWorkout.session.id, draft);
    } else if (pickerState.targetExerciseId) {
      replaceWorkoutExercise(pickerState.targetExerciseId, draft);
    }

    setPickerState(null);
    setComposerOpen(false);
    setActiveMenuExerciseId(null);
    setActiveSetTypeTarget(null);
  }

  function handleOpenCustomComposer() {
    setComposerDraft({
      ...DEFAULT_COMPOSER_DRAFT,
      name: exerciseSearchQuery.trim(),
    });
    setComposerOpen(true);
  }

  function handleSaveCustomExercise() {
    const trimmedName = composerDraft.name.trim();
    const targetSets = Math.max(1, Math.round(Number.parseFloat(composerDraft.targetSets)));

    if (!trimmedName || !Number.isFinite(targetSets)) {
      return;
    }

    if (composerDraft.trackingMode === 'duration') {
      const targetDurationMinutes = Math.max(
        1,
        Math.round(Number.parseFloat(composerDraft.durationMinutes)),
      );

      if (!Number.isFinite(targetDurationMinutes)) {
        return;
      }

      handleSelectExerciseDraft({
        name: trimmedName,
        targetSets,
        targetDurationMinutes,
        trackingMode: 'duration',
      });
      return;
    }

    const targetReps = Math.max(1, Math.round(Number.parseFloat(composerDraft.reps)));
    const currentLoad = Math.max(0, Number.parseFloat(composerDraft.load));

    if (!Number.isFinite(targetReps) || !Number.isFinite(currentLoad)) {
      return;
    }

    handleSelectExerciseDraft({
      currentLoad,
      name: trimmedName,
      repRange: composerDraft.repRange.trim() || `${targetReps}-${targetReps}`,
      targetReps,
      targetSets,
      trackingMode: 'strength',
    });
  }

  function handleFinishWorkout() {
    if (!activeWorkout) {
      return;
    }

    if (activeWorkout.exercises.length === 0 || completedSetCount === 0) {
      cancelWorkoutSession(activeWorkout.session.id);
      router.back();
      return;
    }

    finishWorkoutSession(activeWorkout.session.id);
    router.back();
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
          <PressScale haptic="none" onPress={() => router.back()}>
            <View style={styles.headerButton}>
              <Ionicons name="chevron-back" size={18} color={AppColors.text} />
            </View>
          </PressScale>
          <View style={styles.headerCopy}>
            <TextInput
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeWorkout.exercises.map((exercise) => (
          <SurfaceCard
            key={exercise.id}
            style={[
              styles.exerciseCard,
              exercise.allSetsCompleted ? styles.exerciseCardCompleted : null,
              celebratingExerciseId === exercise.id ? styles.exerciseCardCelebrating : null,
              activeMenuExerciseId === exercise.id ||
              activeSetTypeTarget?.exerciseId === exercise.id
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
                      setActiveSetTypeTarget(null);
                      setActiveMenuExerciseId((currentValue) =>
                        currentValue === exercise.id ? null : exercise.id,
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
              {activeMenuExerciseId === exercise.id ? (
                <View style={styles.exercisePopover}>
                  <PressScale
                    haptic="none"
                    onPress={() => handleOpenExercisePicker('replace', exercise.id)}
                  >
                    <View style={styles.exercisePopoverAction}>
                      <AppText variant="label">Replace exercise</AppText>
                    </View>
                  </PressScale>
                  <PressScale
                    haptic="none"
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      removeWorkoutExercise(exercise.id);
                      setActiveMenuExerciseId(null);
                      setActiveSetTypeTarget(null);
                    }}
                  >
                    <View style={styles.exercisePopoverAction}>
                      <AppText variant="label" color={AppColors.danger}>
                        Remove exercise
                      </AppText>
                    </View>
                  </PressScale>
                </View>
              ) : null}
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
                  MINUTES
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
                        setActiveMenuExerciseId(null);
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
                            setActiveMenuExerciseId(null);
                            setActiveSetTypeTarget((currentValue) =>
                              currentValue?.exerciseId === exercise.id &&
                              currentValue.rowKey === rowKey
                                ? null
                                : {
                                    exerciseId: exercise.id,
                                    rowKey,
                                  },
                            );
                          }}
                        >
                          <View style={styles.setNumberCell}>
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
                            onBlur={() =>
                              commitDraftValue(
                                exercise,
                                setRow,
                                'durationMinutes',
                                setRow.durationMinutes ?? exercise.targetDurationMinutes ?? 20,
                              )
                            }
                            onChangeText={(value) =>
                              handleDraftChange(
                                exercise.id,
                                rowKey,
                                'durationMinutes',
                                value,
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
                              onBlur={() =>
                                commitDraftValue(exercise, setRow, 'load', setRow.load)
                              }
                              onChangeText={(value) =>
                                handleDraftChange(exercise.id, rowKey, 'load', value)
                              }
                              value={getInputValue(
                                exercise.id,
                                rowKey,
                                'load',
                                setRow.load,
                              )}
                            />
                            <WorkoutSetInput
                              onBlur={() =>
                                commitDraftValue(exercise, setRow, 'reps', setRow.reps)
                              }
                              onChangeText={(value) =>
                                handleDraftChange(exercise.id, rowKey, 'reps', value)
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
                    {activeSetTypeTarget?.exerciseId === exercise.id &&
                    activeSetTypeTarget.rowKey === rowKey ? (
                      <View style={styles.setTypePopover}>
                        {SET_TYPE_OPTIONS.map((option) => (
                          <PressScale
                            key={`${rowKey}-${option.value}`}
                            haptic="none"
                            onPress={() => {
                              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                              updateWorkoutSetType(exercise.id, setRow.setNumber, option.value);
                              setActiveSetTypeTarget(null);
                            }}
                          >
                            <View style={styles.setTypeOption}>
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
                      </View>
                    ) : null}
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
          <PressScale haptic="none" onPress={handleFinishWorkout}>
            <View style={styles.cancelWorkoutButton}>
              <AppText variant="label" color={AppColors.danger}>
                Cancel Workout
              </AppText>
            </View>
          </PressScale>
        </View>
        <View style={styles.listFooterSpacer} />
      </ScrollView>

      <ExercisePickerModal
        canCreateCustomExercise={exerciseSearchQuery.trim().length > 0}
        exerciseOptions={filteredExerciseOptions}
        isOpen={Boolean(pickerState)}
        onClose={() => setPickerState(null)}
        onCreateCustom={handleOpenCustomComposer}
        onSelect={(exerciseName) =>
          handleSelectExerciseDraft({
            currentLoad: 45,
            name: exerciseName,
            repRange: '8-10',
            targetReps: 8,
            targetSets: 3,
            trackingMode: 'strength',
          })
        }
        searchQuery={exerciseSearchQuery}
        setSearchQuery={setExerciseSearchQuery}
        title={pickerState?.mode === 'replace' ? 'Replace exercise' : 'Add exercise'}
      />

      <ExerciseComposerModal
        draft={composerDraft}
        isOpen={composerOpen}
        onChange={setComposerDraft}
        onClose={() => setComposerOpen(false)}
        onSave={handleSaveCustomExercise}
      />
      {activeMenuExerciseId || activeSetTypeTarget ? (
        <View pointerEvents="box-none" style={styles.inlineDismissLayer}>
          <PressScale
            containerStyle={styles.inlineDismissBackdrop}
            haptic="none"
            onPress={() => {
              setActiveMenuExerciseId(null);
              setActiveSetTypeTarget(null);
            }}
          >
            <View />
          </PressScale>
        </View>
      ) : null}
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
  onBlur,
  onChangeText,
  style,
  value,
}: {
  onBlur: () => void;
  onChangeText: (value: string) => void;
  style?: object;
  value: string;
}) {
  return (
    <TextInput
      keyboardType="numbers-and-punctuation"
      onBlur={onBlur}
      onChangeText={onChangeText}
      placeholder="0"
      placeholderTextColor={AppColors.textSubtle}
      style={[styles.setInput, style]}
      value={value}
    />
  );
}

function ExercisePickerModal({
  canCreateCustomExercise,
  exerciseOptions,
  isOpen,
  onClose,
  onCreateCustom,
  onSelect,
  searchQuery,
  setSearchQuery,
  title,
}: {
  canCreateCustomExercise: boolean;
  exerciseOptions: string[];
  isOpen: boolean;
  onClose: () => void;
  onCreateCustom: () => void;
  onSelect: (exerciseName: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  title: string;
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
              <AppText variant="title">{title}</AppText>
              <PressScale haptic="none" onPress={onClose}>
                <View style={styles.headerButton}>
                  <Ionicons name="close" size={18} color={AppColors.text} />
                </View>
              </PressScale>
            </View>
            <View style={styles.searchField}>
              <Ionicons name="search" size={18} color={AppColors.textSubtle} />
              <TextInput
                onChangeText={setSearchQuery}
                placeholder="Search exercise"
                placeholderTextColor={AppColors.textSubtle}
                style={styles.searchInput}
                value={searchQuery}
              />
            </View>
            {canCreateCustomExercise ? (
              <PressScale haptic="none" onPress={onCreateCustom}>
                <View style={styles.createCustomButton}>
                  <Ionicons name="create-outline" size={16} color={AppColors.primary} />
                  <AppText variant="label" color={AppColors.primary}>
                    Create custom exercise
                  </AppText>
                </View>
              </PressScale>
            ) : null}
            <ScrollView contentContainerStyle={styles.optionList} showsVerticalScrollIndicator={false}>
              {exerciseOptions.map((exerciseName) => (
                <PressScale
                  key={exerciseName}
                  haptic="none"
                  onPress={() => onSelect(exerciseName)}
                >
                  <View style={styles.optionRow}>
                    <Ionicons name="barbell-outline" size={16} color={AppColors.primary} />
                    <AppText variant="bodyStrong">{exerciseName}</AppText>
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

            <ExerciseInputField
              keyboardType="numbers-and-punctuation"
              label="Sets"
              onChangeText={(value) => onChange({ ...draft, targetSets: value })}
              value={draft.targetSets}
            />

            {draft.trackingMode === 'duration' ? (
              <ExerciseInputField
                keyboardType="numbers-and-punctuation"
                label="Minutes per set"
                onChangeText={(value) => onChange({ ...draft, durationMinutes: value })}
                value={draft.durationMinutes}
              />
            ) : (
              <View style={styles.composerStrengthRow}>
                <ExerciseInputField
                  keyboardType="numbers-and-punctuation"
                  label="Weight"
                  onChangeText={(value) => onChange({ ...draft, load: value })}
                  value={draft.load}
                />
                <ExerciseInputField
                  keyboardType="numbers-and-punctuation"
                  label="Reps"
                  onChangeText={(value) => onChange({ ...draft, reps: value })}
                  value={draft.reps}
                />
              </View>
            )}

            {draft.trackingMode === 'strength' ? (
              <ExerciseInputField
                label="Rep range"
                onChangeText={(value) => onChange({ ...draft, repRange: value })}
                value={draft.repRange}
              />
            ) : null}

            <ActionButton label="Save exercise" onPress={onSave} />
          </SurfaceCard>
        </KeyboardAvoidingView>
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
  keyboardType?: 'default' | 'numbers-and-punctuation';
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
  if (completed) {
    return AppColors.primary;
  }

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
  setCheckButton: {
    width: 32,
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
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '72%',
    gap: Spacing.md,
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
  searchField: {
    minHeight: 44,
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
  createCustomButton: {
    minHeight: 42,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: AppColors.secondaryContainer,
  },
  optionList: {
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  optionRow: {
    minHeight: 48,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: AppColors.surfaceLow,
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
});
