import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { AppColors, Radii, Shadows, Spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';

type ActionButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  style,
  compact = false,
}: ActionButtonProps) {
  return (
    <PressScale containerStyle={style} onPress={onPress}>
      {variant === 'primary' ? (
        <View style={[styles.button, styles.primary, compact && styles.buttonCompact]}>
          <AppText variant="bodyStrong" color={AppColors.white}>
            {label}
          </AppText>
        </View>
      ) : variant === 'secondary' ? (
        <View style={[styles.button, styles.secondary, compact && styles.buttonCompact]}>
          <AppText variant="bodyStrong">{label}</AppText>
        </View>
      ) : (
        <View style={[styles.button, styles.ghost, compact && styles.buttonCompact]}>
          <AppText variant="bodyStrong" color={AppColors.primary}>
            {label}
          </AppText>
        </View>
      )}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  buttonCompact: {
    minHeight: 38,
    paddingHorizontal: Spacing.lg,
  },
  primary: {
    backgroundColor: AppColors.primary,
    ...Shadows.soft,
  },
  secondary: {
    backgroundColor: AppColors.secondary,
  },
  ghost: {
    backgroundColor: AppColors.surfaceLowest,
  },
});
