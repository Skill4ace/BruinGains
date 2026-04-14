import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Theme } from '@react-navigation/native';

import {
  AppColors,
  DarkAppColors,
  DarkNavigationTheme,
  DarkShadows,
  NavigationTheme,
  Shadows,
  type ThemeColors,
  type ThemeShadows,
} from '@/constants/theme';

const THEME_STORAGE_KEY = '@bruingains/theme-mode';

type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  navigationTheme: Theme;
  shadows: ThemeShadows;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: AppColors,
  isDark: false,
  navigationTheme: NavigationTheme,
  shadows: Shadows,
  toggleTheme: () => {},
});

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((value) => {
        if (value === 'dark') {
          setIsDark(true);
        }
      })
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light').catch(() => {});
      return next;
    });
  };

  const value: ThemeContextValue = {
    colors: isDark ? DarkAppColors : AppColors,
    isDark,
    navigationTheme: isDark ? DarkNavigationTheme : NavigationTheme,
    shadows: isDark ? DarkShadows : Shadows,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
