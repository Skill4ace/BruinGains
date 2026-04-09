import { StyleSheet, View } from 'react-native';

import { AppColors, Spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function SectionHeader({ eyebrow, title, actionLabel, onActionPress }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        {eyebrow ? (
          <AppText variant="eyebrow" color={AppColors.textMuted}>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="title">{title}</AppText>
      </View>
      {actionLabel ? (
        <PressScale haptic="none" onPress={onActionPress}>
          <AppText variant="micro" color={AppColors.primary}>
            {actionLabel}
          </AppText>
        </PressScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  copy: {
    gap: Spacing.xs,
    flexShrink: 1,
  },
});
