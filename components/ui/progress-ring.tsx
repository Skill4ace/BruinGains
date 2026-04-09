import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { AppColors } from '@/constants/theme';
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
};

export function ProgressRing({
  progress,
  value,
  unit,
  caption,
  size = 176,
  strokeWidth = 14,
  compact = false,
  color = AppColors.primary,
  trackColor = AppColors.surfaceHighest,
}: ProgressRingProps) {
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
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          animatedProps={animatedProps}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          fill="transparent"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
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
