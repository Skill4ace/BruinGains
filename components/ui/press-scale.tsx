import { useCallback } from 'react';
import type { GestureResponderEvent, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Platform, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressScaleProps = PressableProps & {
  containerStyle?: StyleProp<ViewStyle>;
  haptic?: 'none' | 'light' | 'medium';
  hapticTrigger?: 'pressIn' | 'press';
  pressEffect?: 'none' | 'opacity' | 'scale' | 'smooth';
};

export function PressScale({
  children,
  containerStyle,
  haptic = 'light',
  hapticTrigger = 'pressIn',
  pressEffect = 'scale',
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: PressScaleProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const triggerHaptic = useCallback(() => {
    if (haptic === 'none' || Platform.OS === 'web') {
      return;
    }

    void Haptics.impactAsync(
      haptic === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
    );
  }, [haptic]);

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      if (pressEffect === 'scale') {
        scale.value = withSpring(0.975, {
          damping: 18,
          stiffness: 280,
        });
        opacity.value = withSpring(1, {
          damping: 18,
          stiffness: 280,
        });
      } else if (pressEffect === 'opacity') {
        scale.value = withSpring(1, {
          damping: 18,
          stiffness: 280,
        });
        opacity.value = withSpring(0.82, {
          damping: 18,
          stiffness: 280,
        });
      } else if (pressEffect === 'smooth') {
        scale.value = withTiming(0.992, { duration: 80 });
        opacity.value = withTiming(0.9, { duration: 80 });
      } else {
        scale.value = withSpring(1, {
          damping: 18,
          stiffness: 280,
        });
        opacity.value = withSpring(1, {
          damping: 18,
          stiffness: 280,
        });
      }
      if (hapticTrigger === 'pressIn') {
        triggerHaptic();
      }
      onPressIn?.(event);
    },
    [hapticTrigger, onPressIn, opacity, pressEffect, scale, triggerHaptic]
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      if (pressEffect === 'smooth') {
        scale.value = withTiming(1, { duration: 140 });
        opacity.value = withTiming(1, { duration: 140 });
      } else {
        scale.value = withSpring(1, {
          damping: 18,
          stiffness: 220,
        });
        opacity.value = withSpring(1, {
          damping: 18,
          stiffness: 220,
        });
      }
      onPressOut?.(event);
    },
    [onPressOut, opacity, pressEffect, scale]
  );

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (hapticTrigger === 'press') {
        triggerHaptic();
      }
      onPress?.(event);
    },
    [hapticTrigger, onPress, triggerHaptic]
  );

  return (
    <AnimatedPressable
      {...props}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[containerStyle, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
