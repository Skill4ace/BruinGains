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
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AppDataProvider } from '@/providers/app-data-provider';
import { NavigationTheme } from '@/constants/theme';
import { preloadCampusDataOnLaunch } from '@/hooks/use-campus-data';

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
  const [isLaunchReady, setIsLaunchReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function prepareLaunch() {
      if (!loaded) {
        return;
      }

      try {
        await preloadCampusDataOnLaunch();
      } catch {
        // If live campus data is unavailable at launch, fall back to cached or bundled data.
      } finally {
        if (!isMounted) {
          return;
        }

        setIsLaunchReady(true);
        void SplashScreen.hideAsync();
      }
    }

    void prepareLaunch();

    return () => {
      isMounted = false;
    };
  }, [loaded]);

  if (!loaded || !isLaunchReady) {
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
