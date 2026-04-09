import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { AppText } from '@/components/ui/app-text';
import { SectionHeader } from '@/components/ui/section-header';
import { SegmentedChip } from '@/components/ui/segmented-chip';
import { SurfaceCard } from '@/components/ui/surface-card';
import { profilePreview } from '@/constants/preview-data';
import { AppColors, Radii, Spacing } from '@/constants/theme';

export function ProfileScreenPreview() {
  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText variant="headline">Profile</AppText>
        </View>
      </View>

      <View style={styles.stack}>
        <View style={styles.summaryBlue}>
          <AppText variant="eyebrow" color="rgba(255,255,255,0.72)">
            Week in review
          </AppText>
          <AppText variant="heroNumber" color={AppColors.white}>
            5 workouts
          </AppText>
          <AppText variant="label" color="rgba(255,255,255,0.78)">
            Calories and lifting are trending the right way.
          </AppText>
        </View>
        <View style={styles.statGrid}>
          {profilePreview.summary.map((item) => (
            <SurfaceCard key={item.id} tone="low" style={styles.statCard}>
              <AppText variant="micro" dimmed>
                {item.label}
              </AppText>
              <AppText variant="title">{item.value}</AppText>
            </SurfaceCard>
          ))}
        </View>
      </View>

      <View style={styles.stack}>
        <SectionHeader title="Personal records" />
        {profilePreview.prs.map((record) => (
          <SurfaceCard key={record.id} style={styles.prCard}>
            <View style={styles.prIcon}>
              <Ionicons name="trophy" size={16} color={AppColors.white} />
            </View>
            <View style={styles.prCopy}>
              <AppText variant="micro" dimmed>
                {record.note}
              </AppText>
              <AppText variant="bodyStrong">{record.title}</AppText>
            </View>
            <AppText variant="title" color={AppColors.primary}>
              {record.value}
            </AppText>
          </SurfaceCard>
        ))}
      </View>

      <View style={styles.stack}>
        <SectionHeader title="Goals" />
        <SurfaceCard tone="low" style={styles.goalCard}>
          <GoalRow icon="flame-outline" label="Calories" value={profilePreview.goals.calories} />
          <GoalRow icon="barbell-outline" label="Protein" value={profilePreview.goals.protein} />
        </SurfaceCard>
      </View>

      <View style={styles.stack}>
        <SectionHeader title="Workout templates" actionLabel="Manage" />
        <SurfaceCard style={styles.templateCard}>
          {profilePreview.templates.map((template, index) => (
            <View key={template.id} style={[styles.templateRow, index < profilePreview.templates.length - 1 ? styles.templateRowGap : null]}>
              <View style={styles.templateCopy}>
                <AppText variant="bodyStrong">{template.title}</AppText>
                <AppText variant="label" dimmed>
                  {template.detail}
                </AppText>
              </View>
              <Ionicons name="reorder-three" size={18} color={AppColors.textSubtle} />
            </View>
          ))}
        </SurfaceCard>
      </View>

      <View style={styles.stack}>
        <SectionHeader title="Dining preferences" />
        <View style={styles.preferenceRow}>
          {profilePreview.diningPreferences.map((preference) => (
            <SegmentedChip key={preference} label={preference} selected />
          ))}
        </View>
      </View>
    </AppScreen>
  );
}

function GoalRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.goalRow}>
      <View style={styles.goalIcon}>
        <Ionicons name={icon} size={16} color={AppColors.primary} />
      </View>
      <View style={styles.goalCopy}>
        <AppText variant="micro" dimmed>
          {label}
        </AppText>
        <AppText variant="bodyStrong">{value}</AppText>
      </View>
    </View>
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
  summaryBlue: {
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    backgroundColor: AppColors.primaryContainer,
    gap: Spacing.sm,
  },
  statGrid: {
    gap: Spacing.md,
  },
  statCard: {
    gap: Spacing.xs,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  prIcon: {
    width: 40,
    height: 40,
    borderRadius: Radii.pill,
    backgroundColor: '#A66F00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  goalCard: {
    gap: Spacing.md,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  goalIcon: {
    width: 38,
    height: 38,
    borderRadius: Radii.pill,
    backgroundColor: AppColors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCopy: {
    gap: Spacing.xs,
    flex: 1,
  },
  templateCard: {
    gap: Spacing.md,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  templateRowGap: {
    paddingBottom: Spacing.md,
  },
  templateCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  preferenceRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
});
