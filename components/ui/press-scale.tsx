import { useCallback } from 'react';
import type { GestureResponderEvent, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Platform, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressScaleProps = PressableProps & {
  containerStyle?: StyleProp<ViewStyle>;
  haptic?: 'none' | 'light' | 'medium';
  pressEffect?: 'none' | 'opacity' | 'scale';
};

export function PressScale({
  children,
  containerStyle,
  haptic = 'light',
  pressEffect = 'scale',
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
      triggerHaptic();
      onPressIn?.(event);
    },
    [onPressIn, opacity, pressEffect, scale, triggerHaptic]
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      scale.value = withSpring(1, {
        damping: 18,
        stiffness: 220,
      });
      opacity.value = withSpring(1, {
        damping: 18,
        stiffness: 220,
      });
      onPressOut?.(event);
    },
    [onPressOut, opacity, scale]
  );

  return (
    <AnimatedPressable
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[containerStyle, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
