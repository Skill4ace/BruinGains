import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';
import { Radii, Spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';

type SegmentedChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function SegmentedChip({ label, selected = false, onPress }: SegmentedChipProps) {
  const { colors } = useAppTheme();

  return (
    <PressScale onPress={onPress}>
      <View
        style={[
          styles.chip,
          { backgroundColor: selected ? colors.primary : colors.surfaceLow },
        ]}
      >
        <AppText variant="label" color={selected ? colors.white : colors.textMuted}>
          {label}
        </AppText>
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
