import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Alert, LayoutAnimation, Platform, StyleSheet, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo, useState } from 'react';

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
import type { GymCapacitySnapshot } from '@/types/app-data';

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
    <PressScale containerStyle={styles.capacityCardPressable} haptic="none" onPress={onPress}>
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

export function GymScreenPreview() {
  const router = useRouter();
  const { deleteWorkoutTemplate, startEmptyWorkout, startWorkoutFromTemplate, state } = useAppData();
  const capacityState = useGymCapacities();
  const templates = getWorkoutTemplateSummaries(state);
  const [expandedGymId, setExpandedGymId] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const sortedCapacityData = useMemo(() => {
    const order = ['wooden', 'bfit'];

    return [...capacityState.data].sort((left, right) => {
      const leftIndex = order.indexOf(left.id);
      const rightIndex = order.indexOf(right.id);
      const normalizedLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
      const normalizedRightIndex = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

      if (normalizedLeftIndex !== normalizedRightIndex) {
        return normalizedLeftIndex - normalizedRightIndex;
      }

      return left.name.localeCompare(right.name);
    });
  }, [capacityState.data]);

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
          <PressScale haptic="none" onPress={() => router.push('/workout/template')}>
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
                      onPress={() =>
                        router.push({
                          pathname: '/workout/template',
                          params: { templateId: template.id },
                        })
                      }>
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
});
