import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/ui/action-button';
import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { SectionHeader } from '@/components/ui/section-header';
import { PressScale } from '@/components/ui/press-scale';
import { SurfaceCard } from '@/components/ui/surface-card';
import { gymPreview } from '@/constants/preview-data';
import { AppColors, Radii, Spacing } from '@/constants/theme';

export function GymScreenPreview() {
  const router = useRouter();
  const templateMeta: Record<string, { count: number; focus: string }> = {
    Push: { count: 5, focus: 'Upper body' },
    Legs: { count: 5, focus: 'Lower body' },
    Pull: { count: 5, focus: 'Pull focus' },
    Upper: { count: 5, focus: 'Mixed split' },
  };

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText variant="headline">Gym</AppText>
        </View>
      </View>

      <SurfaceCard floating style={styles.topCard}>
        <SectionHeader title="Capacity" />
        <View style={styles.capacityCompactCard}>
          {gymPreview.capacities.map((location, index) => (
            <View
              key={location.id}
              style={[
                styles.capacityCompactRow,
                index < gymPreview.capacities.length - 1 ? styles.capacityCompactDivider : null,
              ]}>
              <View style={styles.capacityCompactCopy}>
                <View style={styles.capacityTopLine}>
                  <AppText variant="bodyStrong">{location.name}</AppText>
                  <AppText
                    variant="title"
                    color={location.load >= 0.7 ? '#A56D00' : AppColors.primary}>
                    {location.percent}% full
                  </AppText>
                </View>
                <AppText variant="micro" dimmed>
                  {location.hours}
                </AppText>
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
              </View>
            </View>
          ))}
        </View>
      </SurfaceCard>

      <View style={styles.stack}>
        <View style={styles.templatesHeader}>
          <AppText variant="title">Templates</AppText>
          <PressScale haptic="none">
            <View style={styles.addTemplateButton}>
              <Ionicons name="add" size={20} color={AppColors.white} />
            </View>
          </PressScale>
        </View>
        <View style={styles.templateGrid}>
          {gymPreview.templates.map((template) => (
            <PressScale key={template} onPress={() => router.push('/workout/session')} containerStyle={styles.templateCell}>
              <SurfaceCard style={styles.templateCard}>
                <View style={styles.templateTopLine}>
                  <AppText variant="title">{template}</AppText>
                </View>
                <AppText variant="body" dimmed>
                  {templateMeta[template]?.count ?? 0} exercises
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
          <ActionButton label="Start Empty Workout" onPress={() => router.push('/workout/session')} />
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
    alignItems: 'center',
    gap: Spacing.md,
  },
  templateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyWorkoutButton: {
    marginTop: Spacing.lg,
  },
});
