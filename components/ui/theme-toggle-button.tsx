import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';
import { PressScale } from '@/components/ui/press-scale';
import { Radii } from '@/constants/theme';

export function ThemeToggleButton() {
  const { isDark, toggleTheme, colors } = useAppTheme();

  return (
    <PressScale haptic="light" onPress={toggleTheme}>
      <View style={[styles.button, { backgroundColor: colors.surfaceLow }]}>
        <Ionicons
          name={isDark ? 'sunny-outline' : 'moon-outline'}
          size={17}
          color={colors.textMuted}
        />
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
