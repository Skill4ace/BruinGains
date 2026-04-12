import {
  Lexend_600SemiBold,
  Lexend_700Bold,
} from '@expo-google-fonts/lexend';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AppDataProvider } from '@/providers/app-data-provider';
import { NavigationTheme } from '@/constants/theme';
import { ensureAnonymousSupabaseSession, hasSupabasePublicEnv } from '@/lib/supabase/client';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Lexend_600SemiBold,
    Lexend_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      void SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (!hasSupabasePublicEnv) {
      return;
    }

    void ensureAnonymousSupabaseSession().catch(() => {
      // Campus data hooks already fall back to cached and bundled data.
    });
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppDataProvider>
        <ThemeProvider value={NavigationTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="onboarding"
              options={{
                animation: 'slide_from_right',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="workout/session"
              options={{
                animation: 'slide_from_bottom',
                gestureEnabled: true,
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="workout/template"
              options={{
                animation: 'slide_from_bottom',
                gestureEnabled: true,
                presentation: 'modal',
              }}
            />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      </AppDataProvider>
    </GestureHandlerRootView>
  );
}
