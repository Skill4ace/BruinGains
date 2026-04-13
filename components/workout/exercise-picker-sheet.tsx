import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/ui/action-button';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';
import { SurfaceCard } from '@/components/ui/surface-card';
import { AppColors, Radii, Shadows, Spacing } from '@/constants/theme';
import { getExerciseLibraryImageSource } from '@/data/local/exercise-library';
import { formatDurationInput } from '@/lib/workout-duration';
import type { ExerciseLibraryEntry, WorkoutTrackingMode } from '@/types/app-data';

export type ExerciseFilterGroup =
  | 'all'
  | 'arms'
  | 'back'
  | 'cardio'
  | 'chest'
  | 'core'
  | 'legs'
  | 'other'
  | 'shoulders';

export type ExerciseFilterType =
  | 'all'
  | 'barbell'
  | 'bodyweight'
  | 'cardio'
  | 'dumbbell'
  | 'machine';

export type ExerciseComposerDraft = {
  bodyPart: string;
  category: string;
  durationMinutes: string;
  name: string;
  trackingMode: WorkoutTrackingMode;
};

export const DEFAULT_EXERCISE_COMPOSER_DRAFT: ExerciseComposerDraft = {
  bodyPart: '',
  category: '',
  durationMinutes: '20:00',
  name: '',
  trackingMode: 'strength',
};

const COMPOSER_BODY_PARTS = [
  'Arms',
  'Back',
  'Cardio',
  'Chest',
  'Core',
  'Legs',
  'Shoulders',
  'Other',
];

const COMPOSER_CATEGORIES = [
  'Barbell',
  'Dumbbell',
  'Machine',
  'Cable',
  'Bodyweight',
  'Other',
];

export const EXERCISE_FILTER_GROUPS: ExerciseFilterGroup[] = [
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

export const EXERCISE_FILTER_TYPES: ExerciseFilterType[] = [
  'all',
  'barbell',
  'dumbbell',
  'machine',
  'bodyweight',
  'cardio',
];

export function createExerciseComposerDraft(
  overrides?: Partial<ExerciseComposerDraft>,
): ExerciseComposerDraft {
  return {
    ...DEFAULT_EXERCISE_COMPOSER_DRAFT,
    ...overrides,
  };
}

export function formatExerciseLibraryMeta(exercise: ExerciseLibraryEntry) {
  const parts = [
    exercise.bodyPart,
    exercise.target,
    exercise.equipment,
    exercise.secondaryMuscles[0],
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' • ').toLowerCase() : exercise.focus.toLowerCase();
}

export function getExerciseSearchScore(exercise: ExerciseLibraryEntry, query: string) {
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

export function getExerciseFilterGroup(exercise: ExerciseLibraryEntry): ExerciseFilterGroup {
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

export function getExerciseFilterType(exercise: ExerciseLibraryEntry): ExerciseFilterType {
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

export function matchesExerciseFilterGroup(
  exercise: ExerciseLibraryEntry,
  filterGroup: ExerciseFilterGroup,
) {
  return filterGroup === 'all' || getExerciseFilterGroup(exercise) === filterGroup;
}

export function matchesExerciseFilterType(
  exercise: ExerciseLibraryEntry,
  filterType: ExerciseFilterType,
) {
  return filterType === 'all' || getExerciseFilterType(exercise) === filterType;
}

function formatFilterLabel(value: string) {
  if (value === 'all') {
    return 'All';
  }

  if (value === 'bodyweight') {
    return 'Bodyweight';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatPrimaryFilterLabel(value: ExerciseFilterGroup) {
  return value === 'all' ? 'Body Part' : formatFilterLabel(value);
}

function formatSecondaryFilterLabel(value: ExerciseFilterType) {
  return value === 'all' ? 'Category' : formatFilterLabel(value);
}

type ExercisePickerModalProps = {
  canCreateCustomExercise?: boolean;
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
};

export function ExercisePickerModal({
  canCreateCustomExercise = true,
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
}: ExercisePickerModalProps) {
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
              <View style={styles.modalHeaderTrailing}>
                {canCreateCustomExercise ? (
                  <PressScale haptic="light" onPress={onCreateCustom} pressEffect="opacity">
                    <View style={styles.headerCustomButton}>
                      <Ionicons name="add-circle-outline" size={16} color={AppColors.primary} />
                      <AppText variant="micro" color={AppColors.primary}>
                        Custom
                      </AppText>
                    </View>
                  </PressScale>
                ) : null}
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
                          ? `Add (${selectedExerciseIds.length})`
                          : 'Add'}
                      </AppText>
                    </View>
                  </PressScale>
                ) : null}
              </View>
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
            <View style={[styles.filterControlRow, { zIndex: activeFilterMenu ? 20 : 0 }]}>
              <View
                style={[
                  styles.filterSelectorSlot,
                  activeFilterMenu === 'group' ? { zIndex: 20 } : null,
                ]}>
                <PressScale
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
                {activeFilterMenu === 'group' ? (
                  <View style={styles.filterDropdownMenu}>
                    <ScrollView
                      bounces={false}
                      nestedScrollEnabled
                      style={styles.filterDropdownScroll}>
                      {EXERCISE_FILTER_GROUPS.map((value) => (
                        <PressScale
                          key={value}
                          haptic="light"
                          onPress={() => {
                            setFilterGroup(value as ExerciseFilterGroup);
                            setActiveFilterMenu(null);
                          }}
                          pressEffect="opacity">
                          <View
                            style={[
                              styles.filterDropdownOption,
                              filterGroup === value ? styles.filterDropdownOptionActive : null,
                            ]}>
                            <AppText variant={filterGroup === value ? 'bodyStrong' : 'body'}>
                              {formatFilterLabel(value)}
                            </AppText>
                            {filterGroup === value ? (
                              <Ionicons name="checkmark" size={18} color={AppColors.primary} />
                            ) : null}
                          </View>
                        </PressScale>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </View>
              <View
                style={[
                  styles.filterSelectorSlot,
                  activeFilterMenu === 'type' ? { zIndex: 20 } : null,
                ]}>
                <PressScale
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
                {activeFilterMenu === 'type' ? (
                  <View style={styles.filterDropdownMenu}>
                    <ScrollView
                      bounces={false}
                      nestedScrollEnabled
                      style={styles.filterDropdownScroll}>
                      {EXERCISE_FILTER_TYPES.map((value) => (
                        <PressScale
                          key={value}
                          haptic="light"
                          onPress={() => {
                            setFilterType(value as ExerciseFilterType);
                            setActiveFilterMenu(null);
                          }}
                          pressEffect="opacity">
                          <View
                            style={[
                              styles.filterDropdownOption,
                              filterType === value ? styles.filterDropdownOptionActive : null,
                            ]}>
                            <AppText variant={filterType === value ? 'bodyStrong' : 'body'}>
                              {formatFilterLabel(value)}
                            </AppText>
                            {filterType === value ? (
                              <Ionicons name="checkmark" size={18} color={AppColors.primary} />
                            ) : null}
                          </View>
                        </PressScale>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </View>
            </View>
            <FlatList
              contentContainerStyle={styles.optionList}
              data={exerciseOptions}
              extraData={selectedExerciseIds}
              initialNumToRender={16}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(exercise) => exercise.id}
              ListEmptyComponent={
                <SurfaceCard style={styles.emptyExerciseCard}>
                  <AppText variant="bodyStrong">No exercises match yet</AppText>
                  <AppText variant="micro" dimmed>
                    try another search or add a custom exercise.
                  </AppText>
                </SurfaceCard>
              }
              maxToRenderPerBatch={24}
              removeClippedSubviews={Platform.OS === 'android'}
              renderItem={({ item: exercise }) => {
                const selected =
                  pickerMode === 'add' && selectedExerciseIds.includes(exercise.id);

                return (
                  <PressScale
                    containerStyle={styles.optionPressable}
                    haptic="light"
                    onPress={() => onSelect(exercise)}
                    pressEffect="opacity">
                    <View style={[styles.optionMain, selected ? styles.optionMainSelected : null]}>
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
                        <AppText numberOfLines={1} variant="bodyStrong">
                          {exercise.name}
                        </AppText>
                        <AppText dimmed numberOfLines={2} variant="micro">
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
              windowSize={8}
            />
          </SurfaceCard>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

type ExerciseComposerModalProps = {
  allowDurationTracking?: boolean;
  draft: ExerciseComposerDraft;
  isOpen: boolean;
  onChange: (draft: ExerciseComposerDraft) => void;
  onClose: () => void;
  onSave: () => void;
  saveLabel?: string;
  title?: string;
};

export function ExerciseComposerModal({
  allowDurationTracking = false,
  draft,
  isOpen,
  onChange,
  onClose,
  onSave,
  saveLabel = 'Save Exercise',
  title = 'Create New Exercise',
}: ExerciseComposerModalProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={isOpen}>
      <View style={styles.composerScrim}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.composerAvoidingView}>
          <View style={styles.composerCard}>
            <View style={styles.modalHeader}>
              <AppText variant="title">{title}</AppText>
              <PressScale haptic="light" onPress={onClose}>
                <View style={styles.headerButton}>
                  <Ionicons name="close" size={18} color={AppColors.text} />
                </View>
              </PressScale>
            </View>

            <ExerciseInputField
              label="Exercise Name"
              onChangeText={(value) => onChange({ ...draft, name: value })}
              value={draft.name}
            />

            <ComposerDropdownField
              label="Body Part"
              onSelect={(value) => onChange({ ...draft, bodyPart: value })}
              options={COMPOSER_BODY_PARTS}
              selectedValue={draft.bodyPart}
              value={draft.bodyPart || 'Select'}
              zIndex={20}
            />

            <ComposerDropdownField
              label="Category"
              onSelect={(value) => onChange({ ...draft, category: value })}
              options={COMPOSER_CATEGORIES}
              selectedValue={draft.category}
              value={draft.category || 'Select'}
              zIndex={10}
            />

            {allowDurationTracking ? (
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
            ) : null}

            {allowDurationTracking && draft.trackingMode === 'duration' ? (
              <ExerciseInputField
                keyboardType="number-pad"
                label="Duration Per Set"
                onChangeText={(value) =>
                  onChange({
                    ...draft,
                    durationMinutes: formatDurationInput(value),
                  })
                }
                value={draft.durationMinutes}
              />
            ) : null}

            <ActionButton label={saveLabel} onPress={onSave} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function ComposerDropdownField({
  label,
  onSelect,
  options,
  selectedValue,
  value,
  zIndex = 10,
}: {
  label: string;
  onSelect: (value: string) => void;
  options: string[];
  selectedValue: string;
  value: string;
  zIndex?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={[styles.composerDropdownWrapper, { zIndex }]}>
      <PressScale haptic="light" onPress={() => setIsOpen((prev) => !prev)} pressEffect="opacity">
        <View style={styles.composerDropdownTrigger}>
          <AppText dimmed variant="micro">
            {label}
          </AppText>
          <View style={styles.composerDropdownValueRow}>
            <AppText
              color={selectedValue ? AppColors.text : AppColors.textSubtle}
              variant={selectedValue ? 'bodyStrong' : 'body'}>
              {value}
            </AppText>
            <Ionicons
              name={isOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={AppColors.textSubtle}
            />
          </View>
        </View>
      </PressScale>
      {isOpen ? (
        <View style={styles.composerDropdownMenu}>
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            style={styles.composerDropdownScroll}>
            {options.map((option) => {
              const selected = option === selectedValue;

              return (
                <PressScale
                  key={option}
                  haptic="light"
                  onPress={() => {
                    onSelect(option);
                    setIsOpen(false);
                  }}
                  pressEffect="opacity">
                  <View
                    style={[
                      styles.composerDropdownOptionRow,
                      selected ? styles.composerDropdownOptionSelected : null,
                    ]}>
                    <AppText variant={selected ? 'bodyStrong' : 'body'}>{option}</AppText>
                    {selected ? (
                      <Ionicons name="checkmark" size={18} color={AppColors.primary} />
                    ) : null}
                  </View>
                </PressScale>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
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
      <AppText dimmed variant="micro">
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
        <AppText color={selected ? AppColors.white : AppColors.textMuted} variant="label">
          {label}
        </AppText>
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
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
  modalHeaderTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceLowest,
  },
  headerCustomButton: {
    minHeight: 34,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: AppColors.surfaceLow,
  },
  headerAddButton: {
    minHeight: 34,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceLow,
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
    position: 'relative',
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
  filterDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    minWidth: 160,
    marginTop: Spacing.xs,
    borderRadius: Radii.md,
    backgroundColor: AppColors.surfaceLowest,
    borderWidth: 1,
    borderColor: AppColors.outlineVariant,
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
  emptyExerciseCard: {
    gap: Spacing.xs,
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
    backgroundColor: AppColors.surfaceLowest,
    borderRadius: Radii.xl,
    padding: 24,
    paddingBottom: 40,
    gap: 20,
    overflow: 'visible',
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
  composerDropdownWrapper: {
    position: 'relative',
  },
  composerDropdownTrigger: {
    borderRadius: Radii.lg,
    backgroundColor: AppColors.surfaceLow,
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
    backgroundColor: AppColors.surfaceLowest,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: AppColors.outlineVariant,
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
    backgroundColor: AppColors.surfaceLow,
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
});
