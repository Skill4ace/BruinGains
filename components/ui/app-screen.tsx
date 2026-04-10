import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppData } from '@/providers/app-data-provider';
import { AppColors, Layout, Spacing } from '@/constants/theme';

type AppScreenProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  tabbed?: boolean;
}>;

export function AppScreen({ children, contentContainerStyle, tabbed = true }: AppScreenProps) {
  const { state } = useAppData();
  const hasActiveWorkout = Boolean(state.userPreferences.activeWorkoutSessionId);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.contentContainer,
            tabbed
              ? hasActiveWorkout
                ? styles.contentContainerTabbedWithWorkout
                : styles.contentContainerTabbed
              : styles.contentContainerStack,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Layout.pagePadding,
  },
  contentContainerTabbed: {
    paddingBottom: Layout.tabBarHeight + 20,
  },
  contentContainerTabbedWithWorkout: {
    paddingBottom: Layout.tabBarHeight + 104,
  },
  contentContainerStack: {
    paddingBottom: 48,
  },
  content: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    gap: Spacing.xl,
  },
});
