import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useAppTheme } from '@/providers/theme-provider';
import { AppText } from '@/components/ui/app-text';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ProgressRingProps = {
  progress: number;
  value: string;
  unit: string;
  caption: string;
  size?: number;
  strokeWidth?: number;
  compact?: boolean;
  color?: string;
  trackColor?: string;
  hideLabel?: boolean;
};

export function ProgressRing({
  progress,
  value,
  unit,
  caption,
  size = 176,
  strokeWidth = 14,
  compact = false,
  color,
  trackColor,
  hideLabel = false,
}: ProgressRingProps) {
  const { colors } = useAppTheme();
  const resolvedColor = color ?? colors.primary;
  const resolvedTrackColor = trackColor ?? colors.surfaceHighest;
  const clampedProgress = Math.max(0, Math.min(progress, 1));
  const animatedProgress = useSharedValue(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    animatedProgress.value = withTiming(clampedProgress, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedProgress, clampedProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={resolvedTrackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          animatedProps={animatedProps}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={resolvedColor}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          fill="transparent"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      {!hideLabel ? (
        <View style={styles.label}>
          <AppText variant={compact ? 'display' : 'heroNumber'}>{value}</AppText>
          {unit ? (
            <AppText variant="label" dimmed>
              {unit}
            </AppText>
          ) : null}
          {caption ? (
            <AppText variant="micro" dimmed>
              {caption}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    alignItems: 'center',
    gap: 2,
  },
});
