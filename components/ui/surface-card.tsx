import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';
import { Radii, Spacing } from '@/constants/theme';

type SurfaceTone = 'lowest' | 'low' | 'bright';

type SurfaceCardProps = PropsWithChildren<{
  tone?: SurfaceTone;
  floating?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

const TONE_KEY: Record<SurfaceTone, 'surfaceLowest' | 'surfaceLow' | 'surfaceBright'> = {
  lowest: 'surfaceLowest',
  low: 'surfaceLow',
  bright: 'surfaceBright',
};

export function SurfaceCard({ children, tone = 'lowest', floating = false, style }: SurfaceCardProps) {
  const { colors, shadows } = useAppTheme();

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors[TONE_KEY[tone]] },
        floating ? shadows.soft : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.xl,
    padding: Spacing.lg,
  },
});
