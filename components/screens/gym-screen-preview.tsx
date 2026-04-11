import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  Alert,
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
import { useEffect, useState } from 'react';

import {
  getExerciseLibraryImageSource,
  searchExerciseLibraryEntry,
} from '@/data/local/exercise-library';
import { getWorkoutTemplateSummaries } from '@/data/local/selectors';
import { useGymCapacities } from '@/hooks/use-campus-data';
import { useAppData } from '@/providers/app-data-provider';
import { ActionButton } from '@/components/ui/action-button';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';
import { SectionHeader } from '@/components/ui/section-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { AppColors, Radii, Spacing } from '@/constants/theme';
import { Image } from 'expo-image';
import type {
  ExerciseLibraryEntry,
  GymCapacitySnapshot,
  WorkoutTemplateExerciseDraft,
} from '@/types/app-data';

type TemplateExerciseDraftRow = {
  bodyPartLabel: string;
  defaultLoad: string;
  defaultReps: string;
  id: string;
  name: string;
  targetSets: string;
};

function GymCapacityCard({
  isExpanded,
  location,
  onPress,
}: {
  isExpanded: boolean;
  location: GymCapacitySnapshot;
  onPress: () => void;
}) {
  const zones = location.zones ?? [];

  return (
    <PressScale
      containerStyle={styles.capacityCardPressable}
      haptic="none"
      onPress={onPress}>
      <View style={styles.capacityCompactCopy}>
        <View style={styles.capacityTopLine}>
          <AppText variant="bodyStrong">{location.name}</AppText>
          <View style={styles.capacityTopRight}>
            <AppText
              variant="title"
              color={
                location.isClosed
                  ? AppColors.textSubtle
                  : location.load >= 0.7
                    ? '#A56D00'
                    : AppColors.primary
              }>
              {location.isClosed ? 'Closed' : `${location.percent}% full`}
            </AppText>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={AppColors.textSubtle}
            />
          </View>
        </View>
        <AppText variant="micro" dimmed>
          {location.hours}
        </AppText>
        {!location.isClosed ? (
          <View style={styles.capacityBarTrack}>
            <View
              style={[
                styles.capacityBarFill,
                {
                  width: `${location.load * 100}%`,
                  backgroundColor: location.load >= 0.7 ? '#E2A061' : AppColors.primary,
                },
              ]}
            />
          </View>
        ) : null}
        {isExpanded ? (
          <View style={styles.capacityDetailsPanel}>
            <View style={styles.capacityZoneList}>
              {zones.length > 0 ? (
                zones.map((zone) => (
                  <View key={`${location.id}-${zone.name}`} style={styles.capacityZoneRow}>
                    <AppText variant="micro" style={styles.capacityZoneName}>
                      {zone.name}
                    </AppText>
                    <AppText variant="micro" dimmed style={styles.capacityZoneMetric}>
                      {`${zone.count}/${zone.capacity}`}
                    </AppText>
                    <AppText
                      variant="micro"
                      color={AppColors.primary}
                      style={styles.capacityZoneMetric}>
                      {`${zone.percent}%`}
                    </AppText>
                  </View>
                ))
              ) : (
                <AppText variant="micro" dimmed>
                  No zone breakdown available yet.
                </AppText>
              )}
            </View>
          </View>
        ) : null}
      </View>
    </PressScale>
  );
}

export function GymScreenPreview() {
  const router = useRouter();
  const {
    createWorkoutTemplate,
    deleteWorkoutTemplate,
    startEmptyWorkout,
    startWorkoutFromTemplate,
    state,
    updateWorkoutTemplate,
  } = useAppData();
  const capacityState = useGymCapacities();
  const templates = getWorkoutTemplateSummaries(state);
  const [templateComposerOpen, setTemplateComposerOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateNameDraft, setTemplateNameDraft] = useState('');
  const [templateExercisePickerOpen, setTemplateExercisePickerOpen] = useState(false);
  const [templateExerciseSearchQuery, setTemplateExerciseSearchQuery] = useState('');
  const [selectedTemplateExercises, setSelectedTemplateExercises] = useState<TemplateExerciseDraftRow[]>([]);
  const [expandedGymId, setExpandedGymId] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const exerciseOptions = [...state.exerciseLibrary].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  const filteredExerciseOptions = templateExerciseSearchQuery.trim()
    ? exerciseOptions.filter((exercise) =>
        searchExerciseLibraryEntry(exercise, templateExerciseSearchQuery.trim()),
      )
    : exerciseOptions;
  const sortedCapacityData = [...capacityState.data].sort((left, right) => {
    const order = ['wooden', 'bfit'];
    const leftIndex = order.indexOf(left.id);
    const rightIndex = order.indexOf(right.id);
    const normalizedLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const normalizedRightIndex = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

    if (normalizedLeftIndex !== normalizedRightIndex) {
      return normalizedLeftIndex - normalizedRightIndex;
    }

    return left.name.localeCompare(right.name);
  });

  function buildTemplateExerciseDraftRow(
    exercise: ExerciseLibraryEntry,
    overrides?: Partial<TemplateExerciseDraftRow>,
  ): TemplateExerciseDraftRow {
    return {
      bodyPartLabel: (exercise.bodyPart ?? exercise.target ?? exercise.focus).toLowerCase(),
      defaultLoad: '45',
      defaultReps: '8',
      id: overrides?.id ?? exercise.id,
      name: exercise.name,
      targetSets: '3',
      ...overrides,
    };
  }

  function serializeTemplateExerciseDrafts(): WorkoutTemplateExerciseDraft[] {
    return selectedTemplateExercises
      .map((exercise) => ({
        defaultLoad: Math.max(0, Number.parseFloat(exercise.defaultLoad) || 0),
        defaultReps: Math.max(1, Math.round(Number.parseFloat(exercise.defaultReps) || 1)),
        name: exercise.name.trim(),
        targetSets: Math.max(1, Math.round(Number.parseFloat(exercise.targetSets) || 1)),
      }))
      .filter((exercise) => exercise.name);
  }

  function updateTemplateExerciseField(
    exerciseId: string,
    field: 'defaultLoad' | 'defaultReps' | 'targetSets',
    value: string,
  ) {
    setSelectedTemplateExercises((currentValue) =>
      currentValue.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              [field]: value,
            }
          : exercise,
      ),
    );
  }

  function handleCreateTemplate() {
    const serializedExercises = serializeTemplateExerciseDrafts();

    if (!templateNameDraft.trim() || serializedExercises.length === 0) {
      return;
    }

    const templateId = editingTemplateId
      ? (updateWorkoutTemplate({
          exercises: serializedExercises,
          name: templateNameDraft,
          templateId: editingTemplateId,
        }),
        editingTemplateId)
      : createWorkoutTemplate({
          exercises: serializedExercises,
          name: templateNameDraft,
        });

    if (!templateId) {
      return;
    }

    setTemplateComposerOpen(false);
    setTemplateExercisePickerOpen(false);
    setEditingTemplateId(null);
    setTemplateNameDraft('');
    setTemplateExerciseSearchQuery('');
    setSelectedTemplateExercises([]);
  }

  function handleOpenCreateTemplate() {
    setEditingTemplateId(null);
    setTemplateNameDraft('');
    setTemplateExerciseSearchQuery('');
    setSelectedTemplateExercises([]);
    setTemplateExercisePickerOpen(false);
    setTemplateComposerOpen(true);
  }

  function handleOpenEditTemplate(templateId: string) {
    const template = state.workoutTemplates.find((entry) => entry.id === templateId);

    if (!template) {
      return;
    }

    const templateExercises = state.templateExercises
      .filter((exercise) => exercise.templateId === templateId)
      .sort((left, right) => left.order - right.order)
      .map((exercise) => {
        const normalizedExerciseName = exercise.name.trim().toLowerCase();
        const libraryMatch =
          state.exerciseLibrary.find((entry) => entry.name.trim().toLowerCase() === normalizedExerciseName) ??
          state.exerciseLibrary.find((entry) =>
            entry.aliases.some((alias) => alias.trim().toLowerCase() === normalizedExerciseName),
          );

        if (!libraryMatch) {
          return {
            bodyPartLabel: 'custom',
            defaultLoad: String(exercise.defaultLoad),
            defaultReps: String(exercise.defaultReps),
            id: exercise.id,
            name: exercise.name,
            targetSets: String(exercise.targetSets),
          };
        }

        return buildTemplateExerciseDraftRow(libraryMatch, {
          bodyPartLabel: (libraryMatch.bodyPart ?? libraryMatch.target ?? libraryMatch.focus).toLowerCase(),
          defaultLoad: String(exercise.defaultLoad),
          defaultReps: String(exercise.defaultReps),
          id: exercise.id,
          targetSets: String(exercise.targetSets),
        });
      })
      .filter((exercise): exercise is TemplateExerciseDraftRow => Boolean(exercise));

    setEditingTemplateId(templateId);
    setTemplateNameDraft(template.name);
    setTemplateExerciseSearchQuery('');
    setSelectedTemplateExercises(templateExercises);
    setTemplateExercisePickerOpen(false);
    setTemplateComposerOpen(true);
  }

  function handleDeleteTemplate(templateId: string) {
    const template = templates.find((entry) => entry.id === templateId);

    if (!template) {
      return;
    }

    Alert.alert(
      'Delete template?',
      `Delete "${template.name}" and its exercises?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWorkoutTemplate(templateId),
        },
      ],
    );
  }

  function handleAddExerciseToTemplate(exercise: ExerciseLibraryEntry) {
    setSelectedTemplateExercises((currentValue) =>
      currentValue.some(
        (entry) => entry.name.trim().toLowerCase() === exercise.name.trim().toLowerCase(),
      )
        ? currentValue
        : [...currentValue, buildTemplateExerciseDraftRow(exercise)],
    );
  }

  function handleRemoveExerciseFromTemplate(exerciseId: string) {
    setSelectedTemplateExercises((currentValue) =>
      currentValue.filter((exercise) => exercise.id !== exerciseId),
    );
  }

  return (
    <>
      <AppScreen contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText variant="headline">Gym</AppText>
          </View>
        </View>

        <SurfaceCard floating style={styles.topCard}>
          <SectionHeader title="Capacity" />
          {capacityState.error ? (
            <AppText variant="micro" color="#A56D00">
              Refresh unavailable. Showing the best local snapshot.
            </AppText>
          ) : null}
          <View style={styles.capacityCompactCard}>
            {sortedCapacityData.map((location, index) => (
              <View
                key={location.id}
                style={[
                  styles.capacityCompactRow,
                  index < sortedCapacityData.length - 1 ? styles.capacityCompactDivider : null,
                ]}>
                <GymCapacityCard
                  isExpanded={expandedGymId === location.id}
                  location={location}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setExpandedGymId((currentValue) =>
                      currentValue === location.id ? null : location.id,
                    );
                  }}
                />
              </View>
            ))}
          </View>
        </SurfaceCard>

        <View style={styles.stack}>
          <View style={styles.templatesHeader}>
            <AppText variant="title">Templates</AppText>
            <PressScale
              haptic="none"
              onPress={handleOpenCreateTemplate}>
              <View style={styles.addTemplateButton}>
                <Ionicons name="add" size={20} color={AppColors.white} />
              </View>
            </PressScale>
          </View>
          <View style={styles.templateGrid}>
            {templates.map((template) => (
              <View key={template.id} style={styles.templateCell}>
                <SurfaceCard style={styles.templateCard}>
                  <View style={styles.templateTopLine}>
                    <AppText variant="title">{template.name}</AppText>
                    <View style={styles.templateActions}>
                      <PressScale
                        haptic="none"
                        onPress={() => handleOpenEditTemplate(template.id)}>
                        <View style={styles.templateActionButton}>
                          <Ionicons name="pencil-outline" size={15} color={AppColors.primary} />
                        </View>
                      </PressScale>
                      <PressScale
                        haptic="none"
                        onPress={() => handleDeleteTemplate(template.id)}>
                        <View style={styles.templateActionButton}>
                          <Ionicons name="trash-outline" size={15} color={AppColors.danger} />
                        </View>
                      </PressScale>
                    </View>
                  </View>
                  <AppText variant="body" dimmed>
                    {template.exerciseCount > 0
                      ? `${template.exerciseCount} exercises`
                      : 'Empty template'}
                  </AppText>
                  <PressScale
                    haptic="none"
                    onPress={() => {
                      startWorkoutFromTemplate(template.id);
                      router.push('/workout/session');
                    }}>
                    <View style={styles.templateFooter}>
                      <Ionicons name="play-circle" size={18} color={AppColors.primary} />
                      <AppText variant="label" color={AppColors.primary}>
                        Start workout
                      </AppText>
                    </View>
                  </PressScale>
                </SurfaceCard>
              </View>
            ))}
          </View>
          <View style={styles.emptyWorkoutButton}>
            <ActionButton
              label="Start Empty Workout"
              onPress={() => {
                startEmptyWorkout();
                router.push('/workout/session');
              }}
            />
          </View>
        </View>
      </AppScreen>
      <WorkoutTemplateComposerModal
        exerciseOptions={filteredExerciseOptions}
        isOpen={templateComposerOpen}
        isPickerOpen={templateExercisePickerOpen}
        nameValue={templateNameDraft}
        onAddExercise={handleAddExerciseToTemplate}
        onClose={() => {
          setTemplateComposerOpen(false);
          setTemplateExercisePickerOpen(false);
          setEditingTemplateId(null);
        }}
        onClosePicker={() => setTemplateExercisePickerOpen(false)}
        onRemoveExercise={handleRemoveExerciseFromTemplate}
        onSave={handleCreateTemplate}
        primaryActionLabel={editingTemplateId ? 'Save template' : 'Create template'}
        setNameValue={setTemplateNameDraft}
        searchQuery={templateExerciseSearchQuery}
        selectedExercises={selectedTemplateExercises}
        setPickerOpen={setTemplateExercisePickerOpen}
        setSearchQuery={setTemplateExerciseSearchQuery}
        updateExerciseField={updateTemplateExerciseField}
      />
    </>
  );
}

function WorkoutTemplateComposerModal({
  exerciseOptions,
  isOpen,
  isPickerOpen,
  nameValue,
  onAddExercise,
  onClose,
  onClosePicker,
  onRemoveExercise,
  onSave,
  primaryActionLabel,
  setNameValue,
  searchQuery,
  selectedExercises,
  setPickerOpen,
  setSearchQuery,
  updateExerciseField,
}: {
  exerciseOptions: ExerciseLibraryEntry[];
  isOpen: boolean;
  isPickerOpen: boolean;
  nameValue: string;
  onAddExercise: (exercise: ExerciseLibraryEntry) => void;
  onClose: () => void;
  onClosePicker: () => void;
  onRemoveExercise: (exerciseId: string) => void;
  onSave: () => void;
  primaryActionLabel: string;
  setNameValue: (value: string) => void;
  searchQuery: string;
  selectedExercises: TemplateExerciseDraftRow[];
  setPickerOpen: (value: boolean) => void;
  setSearchQuery: (value: string) => void;
  updateExerciseField: (
    exerciseId: string,
    field: 'defaultLoad' | 'defaultReps' | 'targetSets',
    value: string,
  ) => void;
}) {
  return (
    <>
      <Modal animationType="fade" onRequestClose={onClose} transparent visible={isOpen}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.modalRoot}>
          <PressScale containerStyle={styles.modalBackdrop} haptic="none" onPress={onClose}>
            <View />
          </PressScale>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}>
            <SurfaceCard style={styles.modalCardLarge}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <AppText variant="title">
                  {isPickerOpen ? 'Add exercises' : 'Template'}
                </AppText>
                <PressScale
                  haptic="none"
                  onPress={isPickerOpen ? onClosePicker : onClose}>
                  <View style={styles.modalCloseButton}>
                    <Ionicons name="close" size={18} color={AppColors.text} />
                  </View>
                </PressScale>
              </View>
              {isPickerOpen ? (
                <>
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
                  <ScrollView
                    contentContainerStyle={styles.optionList}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>
                    {exerciseOptions.map((exercise) => (
                      <PressScale
                        key={exercise.id}
                        containerStyle={styles.optionPressable}
                        haptic="none"
                        onPress={() => onAddExercise(exercise)}>
                        <View style={styles.optionMain}>
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
                              {[
                                exercise.bodyPart,
                                exercise.target,
                                exercise.equipment,
                              ]
                                .filter(Boolean)
                                .join(' • ')
                                .toLowerCase()}
                            </AppText>
                          </View>
                        </View>
                      </PressScale>
                    ))}
                  </ScrollView>
                  <ActionButton label="Done" onPress={onClosePicker} />
                </>
              ) : (
                <>
                  <View style={styles.inputField}>
                    <AppText variant="micro" dimmed>
                      Template name
                    </AppText>
                    <TextInput
                      onChangeText={setNameValue}
                      placeholder="Push day"
                      placeholderTextColor={AppColors.textSubtle}
                      style={styles.input}
                      value={nameValue}
                    />
                  </View>
                  <View style={styles.templateComposerHeader}>
                    <AppText variant="bodyStrong">
                      {selectedExercises.length} exercises
                    </AppText>
                    <PressScale haptic="none" onPress={() => setPickerOpen(true)}>
                      <View style={styles.addExerciseChip}>
                        <Ionicons name="add" size={16} color={AppColors.primary} />
                        <AppText variant="label" color={AppColors.primary}>
                          Add exercise
                        </AppText>
                      </View>
                    </PressScale>
                  </View>
                  <ScrollView
                    contentContainerStyle={styles.templateExerciseList}
                    showsVerticalScrollIndicator={false}>
                    {selectedExercises.length === 0 ? (
                      <SurfaceCard style={styles.emptyTemplateCard}>
                        <AppText variant="bodyStrong">No exercises yet</AppText>
                        <AppText variant="micro" dimmed>
                          Add at least one exercise before creating this template.
                        </AppText>
                      </SurfaceCard>
                    ) : null}
                    {selectedExercises.map((exercise, index) => (
                      <View key={`${exercise.id}-${index}`} style={styles.templateExerciseRow}>
                        <View style={styles.templateExerciseHeader}>
                          <View style={styles.templateExerciseCopy}>
                            <AppText variant="bodyStrong" numberOfLines={1}>
                              {exercise.name}
                            </AppText>
                            <AppText variant="micro" dimmed numberOfLines={1}>
                              {exercise.bodyPartLabel}
                            </AppText>
                          </View>
                          <PressScale haptic="none" onPress={() => onRemoveExercise(exercise.id)}>
                            <View style={styles.templateExerciseRemoveButton}>
                              <Ionicons name="close" size={16} color={AppColors.textMuted} />
                            </View>
                          </PressScale>
                        </View>
                        <View style={styles.templateExerciseFieldRow}>
                          <View style={styles.templateExerciseField}>
                            <AppText variant="micro" dimmed>
                              sets
                            </AppText>
                            <TextInput
                              keyboardType="numbers-and-punctuation"
                              onChangeText={(value) =>
                                updateExerciseField(exercise.id, 'targetSets', value)
                              }
                              placeholder="3"
                              placeholderTextColor={AppColors.textSubtle}
                              style={styles.templateExerciseInput}
                              value={exercise.targetSets}
                            />
                          </View>
                          <View style={styles.templateExerciseField}>
                            <AppText variant="micro" dimmed>
                              lbs
                            </AppText>
                            <TextInput
                              keyboardType="numbers-and-punctuation"
                              onChangeText={(value) =>
                                updateExerciseField(exercise.id, 'defaultLoad', value)
                              }
                              placeholder="45"
                              placeholderTextColor={AppColors.textSubtle}
                              style={styles.templateExerciseInput}
                              value={exercise.defaultLoad}
                            />
                          </View>
                          <View style={styles.templateExerciseField}>
                            <AppText variant="micro" dimmed>
                              reps
                            </AppText>
                            <TextInput
                              keyboardType="numbers-and-punctuation"
                              onChangeText={(value) =>
                                updateExerciseField(exercise.id, 'defaultReps', value)
                              }
                              placeholder="8"
                              placeholderTextColor={AppColors.textSubtle}
                              style={styles.templateExerciseInput}
                              value={exercise.defaultReps}
                            />
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                  <ActionButton label={primaryActionLabel} onPress={onSave} />
                </>
              )}
            </SurfaceCard>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  headerCopy: {
    gap: Spacing.xs,
  },
  stack: {
    gap: Spacing.md,
  },
  templatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  addTemplateButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCard: {
    gap: Spacing.lg,
  },
  capacityCompactCard: {
    gap: Spacing.sm,
  },
  capacityCompactRow: {
    gap: Spacing.xs,
  },
  capacityCardPressable: {
    borderRadius: Radii.lg,
    backgroundColor: AppColors.surfaceLowest,
    padding: Spacing.md,
  },
  capacityCompactDivider: {
    paddingBottom: Spacing.xs,
  },
  capacityCompactCopy: {
    gap: Spacing.xs,
    flex: 1,
  },
  capacityTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  capacityTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  capacityBarTrack: {
    height: 6,
    borderRadius: Radii.pill,
    overflow: 'hidden',
    backgroundColor: AppColors.surfaceHighest,
    marginTop: Spacing.xs,
  },
  capacityBarFill: {
    height: '100%',
    borderRadius: Radii.pill,
    backgroundColor: AppColors.primary,
  },
  capacityDetailsPanel: {
    marginTop: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: AppColors.surfaceVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  capacityZoneList: {
    gap: Spacing.sm,
  },
  capacityZoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  capacityZoneName: {
    flex: 1,
  },
  capacityZoneMetric: {
    minWidth: 44,
    textAlign: 'right',
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  templateCell: {
    width: '48%',
  },
  templateCard: {
    gap: Spacing.md,
    minHeight: 128,
  },
  templateTopLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  templateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  templateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  templateActionButton: {
    width: 28,
    height: 28,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWorkoutButton: {
    marginTop: Spacing.lg,
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
    gap: Spacing.md,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
  },
  modalCardLarge: {
    maxHeight: '82%',
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
  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
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
  templateComposerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  addExerciseChip: {
    minHeight: 34,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: AppColors.surfaceLow,
  },
  templateExerciseList: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  emptyTemplateCard: {
    gap: Spacing.xs,
  },
  templateExerciseRow: {
    minHeight: 92,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: AppColors.surfaceLow,
  },
  templateExerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  templateExerciseCopy: {
    flex: 1,
    gap: 2,
  },
  templateExerciseRemoveButton: {
    width: 28,
    height: 28,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateExerciseFieldRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  templateExerciseField: {
    flex: 1,
    gap: 4,
  },
  templateExerciseInput: {
    minHeight: 38,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: AppColors.surfaceLowest,
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
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
  optionList: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xxl,
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
});
