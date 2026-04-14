import { DefaultTheme, type Theme } from '@react-navigation/native';
import { Platform } from 'react-native';

const palette = {
  blue900: '#1E6298',
  blue700: '#2774AE',
  blue500: '#5A96C4',
  gold500: '#FECC00',
  gold300: '#FFF1A8',
  ink900: '#1D1F24',
  ink700: '#414651',
  ink500: '#6B7280',
  ink300: '#A0A6AE',
  cloud50: '#F5F5F1',
  cloud100: '#EFEFEA',
  cloud200: '#FFFFFF',
  cloud300: '#E4E7EB',
  cloud400: '#D5DBE2',
  mint500: '#119B73',
  amber500: '#F4B400',
  coral500: '#E7645C',
} as const;

export const AppColors = {
  background: palette.cloud50,
  surface: palette.cloud50,
  surfaceLow: palette.cloud100,
  surfaceLowest: palette.cloud200,
  surfaceHighest: palette.cloud300,
  surfaceVariant: '#F9F9F7',
  surfaceBright: palette.cloud200,
  primary: palette.blue900,
  primaryContainer: palette.blue700,
  secondary: palette.gold500,
  secondaryContainer: '#FFF3B8',
  success: palette.mint500,
  warning: palette.amber500,
  danger: palette.coral500,
  text: palette.ink900,
  textMuted: palette.ink500,
  textSubtle: palette.ink300,
  outlineVariant: 'rgba(29, 31, 36, 0.08)',
  scrim: 'rgba(29, 31, 36, 0.04)',
  white: '#FFFFFF',
} as const;

export const Colors = {
  light: {
    text: AppColors.text,
    background: AppColors.background,
    tint: AppColors.primary,
    icon: AppColors.textMuted,
    tabIconDefault: AppColors.textSubtle,
    tabIconSelected: AppColors.primary,
  },
  dark: {
    text: AppColors.text,
    background: AppColors.background,
    tint: AppColors.primary,
    icon: AppColors.textMuted,
    tabIconDefault: AppColors.textSubtle,
    tabIconSelected: AppColors.primary,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    displayRegular: 'Lexend_600SemiBold',
    displayBold: 'Lexend_700Bold',
    body: 'PlusJakartaSans_400Regular',
    bodyMedium: 'PlusJakartaSans_500Medium',
    bodySemiBold: 'PlusJakartaSans_600SemiBold',
    bodyBold: 'PlusJakartaSans_700Bold',
    mono: 'ui-monospace',
  },
  default: {
    displayRegular: 'Lexend_600SemiBold',
    displayBold: 'Lexend_700Bold',
    body: 'PlusJakartaSans_400Regular',
    bodyMedium: 'PlusJakartaSans_500Medium',
    bodySemiBold: 'PlusJakartaSans_600SemiBold',
    bodyBold: 'PlusJakartaSans_700Bold',
    mono: 'monospace',
  },
  web: {
    displayRegular: 'Lexend_600SemiBold',
    displayBold: 'Lexend_700Bold',
    body: 'PlusJakartaSans_400Regular',
    bodyMedium: 'PlusJakartaSans_500Medium',
    bodySemiBold: 'PlusJakartaSans_600SemiBold',
    bodyBold: 'PlusJakartaSans_700Bold',
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 32,
  huge: 40,
} as const;

export const Radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const Typography = {
  display: {
    fontFamily: Fonts.displayBold,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: -1.1,
  },
  heroNumber: {
    fontFamily: Fonts.displayBold,
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -1.4,
  },
  headline: {
    fontFamily: Fonts.displayBold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: Fonts.displayRegular,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  bodyStrong: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.15,
  },
  micro: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
  },
  eyebrow: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1.3,
    textTransform: 'uppercase' as const,
  },
  tabLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
  },
} as const;

export const Layout = {
  pagePadding: Spacing.lg,
  tabBarHeight: 84,
  maxContentWidth: 560,
} as const;

export const Shadows = {
  floating: {
    shadowColor: AppColors.text,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 7,
  },
  soft: {
    shadowColor: AppColors.text,
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },
} as const;

export const NavigationTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: AppColors.primary,
    background: AppColors.background,
    card: AppColors.surfaceLowest,
    text: AppColors.text,
    border: 'transparent',
    notification: AppColors.secondary,
  },
};

export const Gradients = {
  primary: ['#2F7DBA', AppColors.primary] as const,
  energy: ['#FFE98D', AppColors.secondary] as const,
  hero: ['rgba(255,255,255,0)', 'rgba(255,255,255,0)'] as const,
  surfaceGlow: ['rgba(255,255,255,0)', 'rgba(255,255,255,0)'] as const,
} as const;

export type AppColor = (typeof AppColors)[keyof typeof AppColors];

export type ThemeColors = { [K in keyof typeof AppColors]: string };
export type ThemeShadows = {
  floating: {
    shadowColor: string;
    shadowOpacity: number;
    shadowRadius: number;
    shadowOffset: { width: number; height: number };
    elevation: number;
  };
  soft: {
    shadowColor: string;
    shadowOpacity: number;
    shadowRadius: number;
    shadowOffset: { width: number; height: number };
    elevation: number;
  };
};

export const LightAppColors: ThemeColors = AppColors;

export const DarkAppColors: ThemeColors = {
  background: '#0F1117',
  surface: '#0F1117',
  surfaceLow: '#171B23',
  surfaceLowest: '#1D2129',
  surfaceHighest: '#2A303A',
  surfaceVariant: '#141820',
  surfaceBright: '#1D2129',
  primary: '#4A9FD8',
  primaryContainer: '#3687BC',
  secondary: '#FECC00',
  secondaryContainer: '#332A00',
  success: '#34C795',
  warning: '#F4B400',
  danger: '#F28279',
  text: '#E8EAEE',
  textMuted: '#8C929C',
  textSubtle: '#5A6170',
  outlineVariant: 'rgba(232, 234, 238, 0.08)',
  scrim: 'rgba(232, 234, 238, 0.04)',
  white: '#FFFFFF',
} as const;

export const DarkShadows: ThemeShadows = {
  floating: {
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  soft: {
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

export const DarkNavigationTheme: Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: DarkAppColors.primary,
    background: DarkAppColors.background,
    card: DarkAppColors.surfaceLowest,
    text: DarkAppColors.text,
    border: 'transparent',
    notification: DarkAppColors.secondary,
  },
};
