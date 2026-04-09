import { useCallback } from 'react';
import type { GestureResponderEvent, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Platform, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressScaleProps = PressableProps & {
  containerStyle?: StyleProp<ViewStyle>;
  haptic?: 'none' | 'light' | 'medium';
};

export function PressScale({
  children,
  containerStyle,
  haptic = 'light',
  onPressIn,
  onPressOut,
  ...props
}: PressScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
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
      scale.value = withSpring(0.975, {
        damping: 18,
        stiffness: 280,
      });
      triggerHaptic();
      onPressIn?.(event);
    },
    [onPressIn, scale, triggerHaptic]
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      scale.value = withSpring(1, {
        damping: 18,
        stiffness: 220,
      });
      onPressOut?.(event);
    },
    [onPressOut, scale]
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
