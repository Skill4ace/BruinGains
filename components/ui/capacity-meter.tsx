import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppColors, Radii, Spacing } from '@/constants/theme';
import { AppText } from '@/components/ui/app-text';

type CapacityMeterProps = {
  name: string;
  hours: string;
  percent: number;
  load: number;
  tone?: 'blue' | 'gold';
};

export function CapacityMeter({
  name,
  hours,
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

  const statusPill = getOccupancyLabel(load);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <AppText variant="bodyStrong">{name}</AppText>
          <View style={styles.metaRow}>
            <AppText variant="micro" dimmed>
              {hours}
            </AppText>
            <View style={[styles.statusPill, { backgroundColor: statusPill.backgroundColor }]}>
              <AppText variant="micro" color={statusPill.textColor}>
                {statusPill.label}
              </AppText>
            </View>
          </View>
        </View>
        <AppText variant="title" color={tone === 'gold' ? '#A56D00' : AppColors.primary}>
          {percent}% full
        </AppText>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, animatedStyle]}>
          <LinearGradient
            colors={['#2774AE', '#FECC00', '#E7645C']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradientFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

function getOccupancyLabel(load: number) {
  if (load >= 0.9) {
    return {
      label: 'Very busy',
      backgroundColor: 'rgba(231, 100, 92, 0.12)',
      textColor: '#B13830',
    };
  }

  if (load >= 0.7) {
    return {
      label: 'Moderate',
      backgroundColor: 'rgba(244, 180, 0, 0.16)',
      textColor: '#8A6500',
    };
  }

  return {
    label: 'Light',
    backgroundColor: 'rgba(39, 116, 174, 0.12)',
    textColor: '#1E6298',
  };
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  statusPill: {
    minHeight: 22,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
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
    overflow: 'hidden',
  },
  gradientFill: {
    width: '100%',
    height: '100%',
  },
});
