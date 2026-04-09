import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, Layout, Spacing } from '@/constants/theme';

type AppScreenProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  tabbed?: boolean;
}>;

export function AppScreen({ children, contentContainerStyle, tabbed = true }: AppScreenProps) {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.contentContainer,
            tabbed ? styles.contentContainerTabbed : styles.contentContainerStack,
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
    paddingBottom: Layout.tabBarHeight + 72,
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
