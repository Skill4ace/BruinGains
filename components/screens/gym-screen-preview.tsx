import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

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
import type { ExerciseLibraryEntry } from '@/types/app-data';

export function GymScreenPreview() {
  const router = useRouter();
  const {
    createWorkoutTemplate,
    deleteWorkoutTemplate,
    startEmptyWorkout,
    startWorkoutFromTemplate,
    state,
  } = useAppData();
  const capacityState = useGymCapacities();
  const templates = getWorkoutTemplateSummaries(state);
  const [templateComposerOpen, setTemplateComposerOpen] = useState(false);
  const [templateNameDraft, setTemplateNameDraft] = useState('');
  const [templateExercisePickerOpen, setTemplateExercisePickerOpen] = useState(false);
  const [templateExerciseSearchQuery, setTemplateExerciseSearchQuery] = useState('');
  const [selectedTemplateExercises, setSelectedTemplateExercises] = useState<ExerciseLibraryEntry[]>([]);

  const exerciseOptions = [...state.exerciseLibrary].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  const filteredExerciseOptions = templateExerciseSearchQuery.trim()
    ? exerciseOptions.filter((exercise) =>
        searchExerciseLibraryEntry(exercise, templateExerciseSearchQuery.trim()),
      )
    : exerciseOptions;

  function handleCreateTemplate() {
    if (!templateNameDraft.trim() || selectedTemplateExercises.length === 0) {
      return;
    }

    const templateId = createWorkoutTemplate({
      exercises: selectedTemplateExercises.map((exercise) => exercise.name),
      name: templateNameDraft,
    });

    if (!templateId) {
      return;
    }

    setTemplateComposerOpen(false);
    setTemplateExercisePickerOpen(false);
    setTemplateNameDraft('');
    setTemplateExerciseSearchQuery('');
    setSelectedTemplateExercises([]);
  }

  function handleAddExerciseToTemplate(exercise: ExerciseLibraryEntry) {
    setSelectedTemplateExercises((currentValue) =>
      currentValue.some((entry) => entry.id === exercise.id)
        ? currentValue
        : [...currentValue, exercise],
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
            {capacityState.data.map((location, index) => (
              <View
                key={location.id}
                style={[
                  styles.capacityCompactRow,
                  index < capacityState.data.length - 1 ? styles.capacityCompactDivider : null,
                ]}>
                <View style={styles.capacityCompactCopy}>
                  <View style={styles.capacityTopLine}>
                    <AppText variant="bodyStrong">{location.name}</AppText>
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
                </View>
              </View>
            ))}
          </View>
        </SurfaceCard>

        <View style={styles.stack}>
          <View style={styles.templatesHeader}>
            <AppText variant="title">Templates</AppText>
            <PressScale
              haptic="none"
              onPress={() => {
                setTemplateNameDraft('');
                setTemplateExerciseSearchQuery('');
                setSelectedTemplateExercises([]);
                setTemplateComposerOpen(true);
              }}>
              <View style={styles.addTemplateButton}>
                <Ionicons name="add" size={20} color={AppColors.white} />
              </View>
            </PressScale>
          </View>
          <View style={styles.templateGrid}>
            {templates.map((template) => (
              <PressScale
                key={template.id}
                onPress={() => {
                  startWorkoutFromTemplate(template.id);
                  router.push('/workout/session');
                }}
                containerStyle={styles.templateCell}>
                <SurfaceCard style={styles.templateCard}>
                  <View style={styles.templateTopLine}>
                    <AppText variant="title">{template.name}</AppText>
                    <PressScale
                      haptic="none"
                      onPress={() => deleteWorkoutTemplate(template.id)}>
                      <View style={styles.templateActionButton}>
                        <Ionicons name="trash-outline" size={15} color={AppColors.danger} />
                      </View>
                    </PressScale>
                  </View>
                  <AppText variant="body" dimmed>
                    {template.exerciseCount > 0
                      ? `${template.exerciseCount} exercises`
                      : 'Empty template'}
                  </AppText>
                  <View style={styles.templateFooter}>
                    <Ionicons name="play-circle" size={18} color={AppColors.primary} />
                    <AppText variant="label" color={AppColors.primary}>
                      Start workout
                    </AppText>
                  </View>
                </SurfaceCard>
              </PressScale>
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
        onClose={() => setTemplateComposerOpen(false)}
        onClosePicker={() => setTemplateExercisePickerOpen(false)}
        onRemoveExercise={handleRemoveExerciseFromTemplate}
        onSave={handleCreateTemplate}
        setNameValue={setTemplateNameDraft}
        searchQuery={templateExerciseSearchQuery}
        selectedExercises={selectedTemplateExercises}
        setPickerOpen={setTemplateExercisePickerOpen}
        setSearchQuery={setTemplateExerciseSearchQuery}
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
  setNameValue,
  searchQuery,
  selectedExercises,
  setPickerOpen,
  setSearchQuery,
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
  setNameValue: (value: string) => void;
  searchQuery: string;
  selectedExercises: ExerciseLibraryEntry[];
  setPickerOpen: (value: boolean) => void;
  setSearchQuery: (value: string) => void;
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
                <AppText variant="title">New template</AppText>
                <PressScale haptic="none" onPress={onClose}>
                  <View style={styles.modalCloseButton}>
                    <Ionicons name="close" size={18} color={AppColors.text} />
                  </View>
                </PressScale>
              </View>
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
                    <View style={styles.templateExerciseCopy}>
                      <AppText variant="bodyStrong" numberOfLines={1}>
                        {exercise.name}
                      </AppText>
                      <AppText variant="micro" dimmed numberOfLines={1}>
                        {exercise.bodyPart?.toLowerCase() ?? exercise.focus.toLowerCase()}
                      </AppText>
                    </View>
                    <PressScale haptic="none" onPress={() => onRemoveExercise(exercise.id)}>
                      <View style={styles.templateExerciseRemoveButton}>
                        <Ionicons name="close" size={16} color={AppColors.textMuted} />
                      </View>
                    </PressScale>
                  </View>
                ))}
              </ScrollView>
              <ActionButton label="Create template" onPress={onSave} />
            </SurfaceCard>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
      <Modal animationType="fade" onRequestClose={onClosePicker} transparent visible={isPickerOpen}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.modalRoot}>
          <PressScale containerStyle={styles.modalBackdrop} haptic="none" onPress={onClosePicker}>
            <View />
          </PressScale>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}>
            <SurfaceCard style={styles.modalCardLarge}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <AppText variant="title">Add exercises</AppText>
                <PressScale haptic="none" onPress={onClosePicker}>
                  <View style={styles.modalCloseButton}>
                    <Ionicons name="close" size={18} color={AppColors.text} />
                  </View>
                </PressScale>
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
    gap: Spacing.lg,
  },
  capacityCompactRow: {
    gap: Spacing.sm,
  },
  capacityCompactDivider: {
    paddingBottom: Spacing.md,
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
    minHeight: 52,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    backgroundColor: AppColors.surfaceLow,
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
