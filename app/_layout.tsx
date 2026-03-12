import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { Colors, NavigationThemes } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { AppProviders } from '@/src/providers/app-providers';
import { useSessionStore } from '@/src/store/session-store';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

SplashScreen.preventAutoHideAsync().catch(() => null);

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const colorScheme = useColorScheme();
  const sessionStatus = useSessionStore((state) => state.status);

  if (sessionStatus === 'hydrating') {
    const theme = Colors[colorScheme ?? 'light'];

    return (
      <ThemeProvider value={NavigationThemes[colorScheme ?? 'light']}>
        <ThemedView style={styles.loadingScreen}>
          <ActivityIndicator color={theme.primary} size="large" />
          <ThemedText type="eyebrow">Salud De Una</ThemedText>
          <ThemedText type="title" style={styles.loadingTitle}>
            Preparando tu sesion
          </ThemedText>
          <ThemedText style={styles.loadingCopy} type="muted">
            Cargando configuracion, tema y estado autenticado del paciente.
          </ThemedText>
        </ThemedView>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={NavigationThemes[colorScheme ?? 'light']}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => null);
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingTitle: {
    textAlign: 'center',
  },
  loadingCopy: {
    maxWidth: 280,
    textAlign: 'center',
  },
});
