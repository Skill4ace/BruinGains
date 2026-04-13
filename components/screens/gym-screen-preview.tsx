import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
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
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getExerciseLibraryImageSource } from '@/data/local/exercise-library';
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
import type { ExerciseLibraryEntry, GymCapacitySnapshot } from '@/types/app-data';

type TemplateActionTarget = {
  templateId: string;
  templateName: string;
};

type TemplatePreviewExercise = {
  id: string;
  imageEntry: ExerciseLibraryEntry | null;
  meta: string;
  name: string;
};

type TemplatePreviewData = {
  exercises: TemplatePreviewExercise[];
  templateId: string;
  templateName: string;
};

const LOS_ANGELES_TIME_ZONE = 'America/Los_Angeles';

function normalizeExerciseLookupKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function formatTemplateExerciseMeta(exercise: {
  repRange: string;
  targetDurationMinutes?: number | null;
  targetSets: number;
  trackingMode: 'strength' | 'duration';
}, imageEntry: ExerciseLibraryEntry | null) {
  const focusLabel =
    imageEntry?.target ?? imageEntry?.bodyPart ?? imageEntry?.focus ?? 'Exercise';
  const setLabel =
    exercise.trackingMode === 'duration'
      ? `${exercise.targetSets} sets • ${exercise.targetDurationMinutes ?? 20} min`
      : `${exercise.targetSets} sets • ${exercise.repRange}`;

  return `${focusLabel} • ${setLabel}`;
}

function getLosAngelesCurrentMinutes() {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    timeZone: LOS_ANGELES_TIME_ZONE,
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return Number.parseInt(values.hour, 10) * 60 + Number.parseInt(values.minute, 10);
}

function parseGymClockMinutes(value: string) {
  const match = value.trim().match(/(\d{1,2}):(\d{2})\s*([ap])\.?\s*m\.?/i);

  if (!match) {
    return null;
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  const marker = match[3].toLowerCase();
  let normalizedHour = hour % 12;

  if (marker === 'p') {
    normalizedHour += 12;
  }

  return normalizedHour * 60 + minute;
}

function parseGymHoursRange(hours: string) {
  const [startValue, endValue] = hours.trim().split(/\s*-\s*/);

  if (!startValue || !endValue) {
    return null;
  }

  const startMinutes = parseGymClockMinutes(startValue);
  const endMinutes = parseGymClockMinutes(endValue);

  if (startMinutes === null || endMinutes === null) {
    return null;
  }

  return {
    crossesMidnight: startMinutes >= endMinutes,
    endMinutes,
    startMinutes,
  };
}

function isGymOpenForDisplayedHours(hours: string, currentMinutes: number) {
  const normalizedHours = hours.trim().toLowerCase();

  if (!normalizedHours || normalizedHours === 'closed') {
    return false;
  }

  const range = parseGymHoursRange(hours);

  if (!range) {
    return null;
  }

  return range.crossesMidnight
    ? currentMinutes >= range.startMinutes || currentMinutes < range.endMinutes
    : currentMinutes >= range.startMinutes && currentMinutes < range.endMinutes;
}

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
    <PressScale containerStyle={styles.capacityCardPressable} haptic="light" onPress={onPress}>
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
                    <AppText variant="micro" color={AppColors.primary} style={styles.capacityZoneMetric}>
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

function TemplateActionModal({
  isOpen,
  onClose,
  onDelete,
  onDuplicate,
  onEdit,
  onRename,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onRename: () => void;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={isOpen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.modalRoot}>
        <PressScale containerStyle={styles.modalBackdrop} haptic="none" onPress={onClose}>
          <View />
        </PressScale>
        <View style={styles.centerModalContainer}>
          <SurfaceCard style={styles.smallActionModalCard}>
            <PressScale haptic="none" onPress={onRename}>
              <View style={styles.smallActionModalButton}>
                <AppText variant="label">Rename template</AppText>
              </View>
            </PressScale>
            <PressScale haptic="none" onPress={onEdit}>
              <View style={styles.smallActionModalButton}>
                <AppText variant="label">Edit template</AppText>
              </View>
            </PressScale>
            <PressScale haptic="none" onPress={onDuplicate}>
              <View style={styles.smallActionModalButton}>
                <AppText variant="label">Duplicate template</AppText>
              </View>
            </PressScale>
            <PressScale haptic="none" onPress={onDelete}>
              <View style={styles.smallActionModalButton}>
                <AppText variant="label" color={AppColors.danger}>
                  Delete template
                </AppText>
              </View>
            </PressScale>
          </SurfaceCard>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function RenameTemplateModal({
  draft,
  isOpen,
  onChangeDraft,
  onClose,
  onSave,
}: {
  draft: string;
  isOpen: boolean;
  onChangeDraft: (value: string) => void;
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
          style={styles.centerModalContainer}>
          <SurfaceCard style={styles.renameModalCard}>
            <View style={styles.renameModalHeader}>
              <View style={styles.renameModalCopy}>
                <AppText variant="title">Rename template</AppText>
                <AppText variant="micro" dimmed>
                  Update how this workout shows up in your template list.
                </AppText>
              </View>
              <PressScale haptic="none" onPress={onClose}>
                <View style={styles.renameCloseButton}>
                  <Ionicons name="close" size={18} color={AppColors.text} />
                </View>
              </PressScale>
            </View>

            <View style={styles.renameInputField}>
              <AppText variant="micro" dimmed>
                Template name
              </AppText>
              <TextInput
                autoFocus
                onChangeText={onChangeDraft}
                onSubmitEditing={onSave}
                placeholder="Push Day"
                placeholderTextColor={AppColors.textSubtle}
                returnKeyType="done"
                selectTextOnFocus
                style={styles.renameInput}
                value={draft}
              />
            </View>

            <View style={styles.renameActionRow}>
              <PressScale
                containerStyle={styles.renameActionSlot}
                haptic="none"
                onPress={onClose}>
                <View style={styles.renameSecondaryButton}>
                  <AppText variant="label">Cancel</AppText>
                </View>
              </PressScale>
              <PressScale
                containerStyle={styles.renameActionSlot}
                haptic="light"
                onPress={onSave}>
                <View style={styles.renamePrimaryButton}>
                  <AppText variant="label" color={AppColors.white}>
                    Save
                  </AppText>
                </View>
              </PressScale>
            </View>
          </SurfaceCard>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function TemplatePreviewModal({
  isOpen,
  onClose,
  onStartWorkout,
  preview,
}: {
  isOpen: boolean;
  onClose: () => void;
  onStartWorkout: () => void;
  preview: TemplatePreviewData | null;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={isOpen}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.modalRoot}>
        <PressScale containerStyle={styles.modalBackdrop} haptic="none" onPress={onClose}>
          <View />
        </PressScale>
        <View style={styles.centerModalContainer}>
          <SurfaceCard style={styles.previewModalCard}>
            <View style={styles.previewModalHeader}>
              <View style={styles.previewModalCopy}>
                <AppText variant="title">{preview?.templateName ?? 'Template'}</AppText>
                <AppText variant="micro" dimmed>
                  {preview
                    ? `${preview.exercises.length} exercise${
                        preview.exercises.length === 1 ? '' : 's'
                      }`
                    : ''}
                </AppText>
              </View>
              <PressScale haptic="none" onPress={onClose}>
                <View style={styles.renameCloseButton}>
                  <Ionicons name="close" size={18} color={AppColors.text} />
                </View>
              </PressScale>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.previewExerciseList}>
              {preview?.exercises.map((exercise) => {
                const imageSource = exercise.imageEntry
                  ? getExerciseLibraryImageSource(exercise.imageEntry)
                  : null;

                return (
                  <View key={exercise.id} style={styles.previewExerciseRow}>
                    {imageSource ? (
                      <Image
                        source={imageSource}
                        style={styles.previewExerciseImage}
                        autoplay={false}
                        contentFit="contain"
                      />
                    ) : (
                      <View style={styles.previewExerciseImageFallback}>
                        <Ionicons name="barbell-outline" size={18} color={AppColors.primary} />
                      </View>
                    )}
                    <View style={styles.previewExerciseCopy}>
                      <AppText variant="bodyStrong">{exercise.name}</AppText>
                      <AppText variant="micro" dimmed>
                        {exercise.meta}
                      </AppText>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <ActionButton label="Start Workout" onPress={onStartWorkout} />
          </SurfaceCard>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export function GymScreenPreview() {
  const router = useRouter();
  const {
    deleteWorkoutTemplate,
    duplicateWorkoutTemplate,
    renameWorkoutTemplate,
    startEmptyWorkout,
    startWorkoutFromTemplate,
    state,
  } = useAppData();
  const capacityState = useGymCapacities();
  const templates = getWorkoutTemplateSummaries(state);
  const [expandedGymId, setExpandedGymId] = useState<string | null>(null);
  const [activeTemplateAction, setActiveTemplateAction] = useState<TemplateActionTarget | null>(
    null,
  );
  const [activeTemplatePreviewId, setActiveTemplatePreviewId] = useState<string | null>(null);
  const [currentLosAngelesMinutes, setCurrentLosAngelesMinutes] = useState(() =>
    getLosAngelesCurrentMinutes(),
  );
  const [renameDraft, setRenameDraft] = useState('');
  const [renamingTemplate, setRenamingTemplate] = useState<TemplateActionTarget | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentLosAngelesMinutes(getLosAngelesCurrentMinutes());
    }, 60_000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const sortedCapacityData = useMemo(() => {
    const order = ['wooden', 'bfit'];

    return capacityState.data
      .map((location) => {
        const openForDisplayedHours = isGymOpenForDisplayedHours(
          location.hours,
          currentLosAngelesMinutes,
        );
        const shouldForceClosed = openForDisplayedHours === false;

        return shouldForceClosed
          ? {
              ...location,
              isClosed: true,
              load: 0,
              percent: 0,
            }
          : location;
      })
      .sort((left, right) => {
        const leftIndex = order.indexOf(left.id);
        const rightIndex = order.indexOf(right.id);
        const normalizedLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
        const normalizedRightIndex = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

      if (normalizedLeftIndex !== normalizedRightIndex) {
        return normalizedLeftIndex - normalizedRightIndex;
      }

        return left.name.localeCompare(right.name);
      });
  }, [capacityState.data, currentLosAngelesMinutes]);

  const exerciseLibraryLookup = useMemo(() => {
    const nextLookup = new Map<string, ExerciseLibraryEntry>();

    state.exerciseLibrary.forEach((exercise) => {
      [exercise.name, ...exercise.aliases].forEach((value) => {
        const normalizedKey = normalizeExerciseLookupKey(value);

        if (normalizedKey && !nextLookup.has(normalizedKey)) {
          nextLookup.set(normalizedKey, exercise);
        }
      });
    });

    return nextLookup;
  }, [state.exerciseLibrary]);

  const activeTemplatePreview = useMemo(() => {
    if (!activeTemplatePreviewId) {
      return null;
    }

    const template = templates.find((entry) => entry.id === activeTemplatePreviewId);

    if (!template) {
      return null;
    }

    return {
      exercises: state.templateExercises
        .filter((exercise) => exercise.templateId === activeTemplatePreviewId)
        .sort((left, right) => left.order - right.order)
        .map((exercise) => {
          const imageEntry =
            exerciseLibraryLookup.get(normalizeExerciseLookupKey(exercise.name)) ?? null;

          return {
            id: exercise.id,
            imageEntry,
            meta: formatTemplateExerciseMeta(exercise, imageEntry),
            name: exercise.name,
          };
        }),
      templateId: template.id,
      templateName: template.name,
    } satisfies TemplatePreviewData;
  }, [activeTemplatePreviewId, exerciseLibraryLookup, state.templateExercises, templates]);

  function handleDeleteTemplate(template: TemplateActionTarget) {
    setActiveTemplateAction(null);
    Alert.alert(
      'Delete template?',
      `Delete "${template.templateName}" and its exercises?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            deleteWorkoutTemplate(template.templateId);
          },
        },
      ],
    );
  }

  function handleEditTemplate(templateId: string) {
    setActiveTemplateAction(null);
    router.push({
      pathname: '/workout/template',
      params: { templateId },
    });
  }

  function handleOpenRenameModal(template: TemplateActionTarget) {
    setActiveTemplateAction(null);
    setRenameDraft(template.templateName);
    setRenamingTemplate(template);
  }

  function handleCloseRenameModal() {
    setRenameDraft('');
    setRenamingTemplate(null);
  }

  function handleCloseTemplatePreview() {
    setActiveTemplatePreviewId(null);
  }

  function handleSaveRename() {
    if (!renamingTemplate) {
      return;
    }

    const trimmedName = renameDraft.trim();

    if (!trimmedName) {
      Alert.alert('Template name required', 'Enter a name before saving.');
      return;
    }

    renameWorkoutTemplate(renamingTemplate.templateId, trimmedName);
    handleCloseRenameModal();
  }

  return (
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
          <PressScale haptic="light" onPress={() => router.push('/workout/template')}>
            <View style={styles.addTemplateButton}>
              <Ionicons name="add" size={20} color={AppColors.white} />
            </View>
          </PressScale>
        </View>
        {templates.length > 0 ? (
          <View style={styles.templateGrid}>
            {templates.map((template) => (
              <PressScale
                key={template.id}
                containerStyle={styles.templateCell}
                haptic="light"
                pressEffect="opacity"
                onPress={() => setActiveTemplatePreviewId(template.id)}>
                <SurfaceCard style={styles.templateCard}>
                  <View style={styles.templateTopLine}>
                    <AppText numberOfLines={1} style={styles.templateTitle} variant="title">
                      {template.name}
                    </AppText>
                    <PressScale
                      haptic="light"
                      onPress={(event) => {
                        event.stopPropagation();
                        setActiveTemplateAction({
                          templateId: template.id,
                          templateName: template.name,
                        });
                      }}>
                      <View style={styles.templateMoreButton}>
                        <Ionicons name="ellipsis-horizontal" size={16} color={AppColors.text} />
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
        ) : (
          <SurfaceCard style={styles.emptyTemplateState}>
            <AppText variant="title">No templates yet</AppText>
            <AppText variant="body" dimmed>
              Add one from the + button or start an empty workout and build from there.
            </AppText>
          </SurfaceCard>
        )}
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

      <TemplateActionModal
        isOpen={Boolean(activeTemplateAction)}
        onClose={() => setActiveTemplateAction(null)}
        onDelete={() => {
          if (!activeTemplateAction) {
            return;
          }

          handleDeleteTemplate(activeTemplateAction);
        }}
        onDuplicate={() => {
          if (!activeTemplateAction) {
            return;
          }

          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          duplicateWorkoutTemplate(activeTemplateAction.templateId);
          setActiveTemplateAction(null);
        }}
        onEdit={() => {
          if (!activeTemplateAction) {
            return;
          }

          handleEditTemplate(activeTemplateAction.templateId);
        }}
        onRename={() => {
          if (!activeTemplateAction) {
            return;
          }

          handleOpenRenameModal(activeTemplateAction);
        }}
      />

      <RenameTemplateModal
        draft={renameDraft}
        isOpen={Boolean(renamingTemplate)}
        onChangeDraft={setRenameDraft}
        onClose={handleCloseRenameModal}
        onSave={handleSaveRename}
      />

      <TemplatePreviewModal
        isOpen={Boolean(activeTemplatePreview)}
        onClose={handleCloseTemplatePreview}
        onStartWorkout={() => {
          if (!activeTemplatePreview) {
            return;
          }

          handleCloseTemplatePreview();
          startWorkoutFromTemplate(activeTemplatePreview.templateId);
          router.push('/workout/session');
        }}
        preview={activeTemplatePreview}
      />
    </AppScreen>
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
    justifyContent: 'space-between',
  },
  emptyTemplateState: {
    gap: Spacing.sm,
  },
  templateTopLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  templateTitle: {
    flex: 1,
  },
  templateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  templateMoreButton: {
    width: 30,
    height: 30,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 14, 18, 0.44)',
  },
  centerModalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  smallActionModalCard: {
    width: '100%',
    maxWidth: 280,
    gap: Spacing.xs,
    borderRadius: Radii.xl,
  },
  smallActionModalButton: {
    minHeight: 42,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  renameModalCard: {
    width: '100%',
    maxWidth: 320,
    gap: Spacing.md,
    borderRadius: Radii.xl,
  },
  renameModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  renameModalCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  renameCloseButton: {
    width: 32,
    height: 32,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceLow,
  },
  renameInputField: {
    gap: Spacing.xs,
  },
  renameInput: {
    minHeight: 46,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: AppColors.surfaceLow,
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  renameActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  renameActionSlot: {
    flex: 1,
  },
  previewModalCard: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '78%',
    gap: Spacing.md,
    borderRadius: Radii.xl,
  },
  previewModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  previewModalCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  previewExerciseList: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  previewExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: AppColors.surfaceLow,
  },
  previewExerciseImage: {
    width: 56,
    height: 56,
    borderRadius: Radii.lg,
    backgroundColor: AppColors.surfaceHighest,
  },
  previewExerciseImageFallback: {
    width: 56,
    height: 56,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceHighest,
  },
  previewExerciseCopy: {
    flex: 1,
    gap: 2,
  },
  renameSecondaryButton: {
    minHeight: 40,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceLow,
  },
  renamePrimaryButton: {
    minHeight: 40,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
  },
  emptyWorkoutButton: {
    marginTop: Spacing.lg,
  },
});
