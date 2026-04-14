import type { TextProps, TextStyle } from 'react-native';
import { StyleSheet, Text } from 'react-native';

import { useAppTheme } from '@/providers/theme-provider';
import { AppColors, Typography } from '@/constants/theme';

type TextVariant = keyof typeof Typography;

type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: string;
  dimmed?: boolean;
};

export function AppText({
  variant = 'body',
  color,
  dimmed = false,
  style,
  ...props
}: AppTextProps) {
  const { colors } = useAppTheme();
  const resolvedColor = color ?? (dimmed ? colors.textMuted : colors.text);

  return <Text allowFontScaling={false} style={[styles.base, styles[variant], { color: resolvedColor }, style]} {...props} />;
}

const styles = StyleSheet.create<Record<TextVariant | 'base', TextStyle>>({
  base: {
    color: AppColors.text,
  },
  display: Typography.display,
  heroNumber: Typography.heroNumber,
  headline: Typography.headline,
  title: Typography.title,
  body: Typography.body,
  bodyStrong: Typography.bodyStrong,
  label: Typography.label,
  micro: Typography.micro,
  eyebrow: Typography.eyebrow,
  tabLabel: Typography.tabLabel,
});
