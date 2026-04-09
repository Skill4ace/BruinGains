import { StyleSheet, View } from 'react-native';

import { AppColors, Radii, Spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';

type SegmentedChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function SegmentedChip({ label, selected = false, onPress }: SegmentedChipProps) {
  return (
    <PressScale onPress={onPress}>
      <View style={[styles.chip, selected ? styles.chipSelected : styles.chipDefault]}>
        <AppText variant="label" color={selected ? AppColors.white : AppColors.textMuted}>
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
  chipDefault: {
    backgroundColor: AppColors.surfaceLow,
  },
  chipSelected: {
    backgroundColor: AppColors.primary,
  },
});
