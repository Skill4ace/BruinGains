import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { AppColors, Radii, Shadows, Spacing } from '@/constants/theme';

type SurfaceTone = 'lowest' | 'low' | 'bright';

type SurfaceCardProps = PropsWithChildren<{
  tone?: SurfaceTone;
  floating?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function SurfaceCard({ children, tone = 'lowest', floating = false, style }: SurfaceCardProps) {
  return <View style={[styles.base, styles[tone], floating ? styles.floating : null, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.xl,
    padding: Spacing.lg,
  },
  lowest: {
    backgroundColor: AppColors.surfaceLowest,
  },
  low: {
    backgroundColor: AppColors.surfaceLow,
  },
  bright: {
    backgroundColor: AppColors.surfaceBright,
  },
  floating: {
    ...Shadows.soft,
  },
});
