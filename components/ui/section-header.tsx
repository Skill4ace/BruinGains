import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';
import { Spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function SectionHeader({ eyebrow, title, actionLabel, onActionPress }: SectionHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        {eyebrow ? (
          <AppText variant="eyebrow" color={colors.textMuted}>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="title">{title}</AppText>
      </View>
      {actionLabel ? (
        <PressScale haptic="none" onPress={onActionPress}>
          <AppText variant="micro" color={colors.primary}>
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
