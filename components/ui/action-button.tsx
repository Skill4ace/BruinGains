import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';
import { Radii, Spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/app-text';
import { PressScale } from '@/components/ui/press-scale';

type ActionButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  pressEffect?: 'none' | 'opacity' | 'scale';
};

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  style,
  compact = false,
  pressEffect = 'scale',
}: ActionButtonProps) {
  const { colors, shadows } = useAppTheme();

  return (
    <PressScale containerStyle={style} onPress={onPress} pressEffect={pressEffect}>
      {variant === 'primary' ? (
        <View style={[styles.button, { backgroundColor: colors.primary }, shadows.soft, compact && styles.buttonCompact]}>
          <AppText variant="bodyStrong" color={colors.white}>
            {label}
          </AppText>
        </View>
      ) : variant === 'secondary' ? (
        <View style={[styles.button, { backgroundColor: colors.secondary }, compact && styles.buttonCompact]}>
          <AppText variant="bodyStrong">{label}</AppText>
        </View>
      ) : (
        <View style={[styles.button, { backgroundColor: colors.surfaceLowest }, compact && styles.buttonCompact]}>
          <AppText variant="bodyStrong" color={colors.primary}>
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
});
