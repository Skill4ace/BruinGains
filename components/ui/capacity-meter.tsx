import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppColors, Radii, Spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/app-text';

type CapacityMeterProps = {
  name: string;
  status: string;
  percent: number;
  load: number;
  tone?: 'blue' | 'gold';
};

export function CapacityMeter({
  name,
  status,
  percent,
  load,
  tone = 'blue',
}: CapacityMeterProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(load, 1)), {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [load, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <AppText variant="bodyStrong">{name}</AppText>
          <AppText variant="micro" color={tone === 'gold' ? '#A56D00' : AppColors.success}>
            {status}
          </AppText>
        </View>
        <AppText variant="title" color={tone === 'gold' ? '#A56D00' : AppColors.primary}>
          {percent}%
        </AppText>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, tone === 'gold' ? styles.fillGold : styles.fillBlue, animatedStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.lg,
    alignItems: 'center',
  },
  copy: {
    gap: Spacing.xs,
    flex: 1,
  },
  track: {
    height: 6,
    borderRadius: Radii.pill,
    overflow: 'hidden',
    backgroundColor: AppColors.surfaceHighest,
  },
  fill: {
    height: '100%',
    borderRadius: Radii.pill,
  },
  fillBlue: {
    backgroundColor: AppColors.primaryContainer,
  },
  fillGold: {
    backgroundColor: AppColors.secondary,
  },
});
