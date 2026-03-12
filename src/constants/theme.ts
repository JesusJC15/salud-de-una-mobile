import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { Platform } from 'react-native';

const interWebStack = "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const fontFamilies = Platform.select({
  ios: {
    regular: 'Inter_400Regular',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    mono: 'ui-monospace',
  },
  android: {
    regular: 'Inter_400Regular',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    mono: 'monospace',
  },
  web: {
    regular: interWebStack,
    semibold: interWebStack,
    bold: interWebStack,
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  default: {
    regular: 'sans-serif',
    semibold: 'sans-serif-medium',
    bold: 'sans-serif',
    mono: 'monospace',
  },
});

export const Colors = {
  light: {
    text: '#0F2E32',
    textMuted: '#54777B',
    background: '#F0F9FA',
    surface: '#FCFFFF',
    surfaceMuted: '#E8F8F9',
    tint: '#14B8A6',
    primary: '#14B8A6',
    primaryForeground: '#F4FFFD',
    secondary: '#D7F3F5',
    secondaryForeground: '#0E4C52',
    border: '#B7E4E7',
    input: '#CDEBED',
    icon: '#54777B',
    tabIconDefault: '#7AA3A7',
    tabIconSelected: '#14B8A6',
    success: '#0F9F8F',
    warning: '#F59E0B',
    destructive: '#DC2626',
    info: '#0891B2',
    link: '#0891B2',
    card: '#FCFFFF',
    heroStart: '#F7FEFF',
    heroEnd: '#E6F7F8',
    overlay: 'rgba(8, 47, 50, 0.08)',
  },
  dark: {
    text: '#E6FBFB',
    textMuted: '#95C4C9',
    background: '#082F32',
    surface: '#0D3E43',
    surfaceMuted: '#0A3438',
    tint: '#2DD4BF',
    primary: '#2DD4BF',
    primaryForeground: '#072426',
    secondary: '#0D4B54',
    secondaryForeground: '#DCFBFF',
    border: 'rgba(174, 244, 239, 0.18)',
    input: 'rgba(174, 244, 239, 0.12)',
    icon: '#95C4C9',
    tabIconDefault: '#6E9BA0',
    tabIconSelected: '#2DD4BF',
    success: '#34D399',
    warning: '#FBBF24',
    destructive: '#F87171',
    info: '#22D3EE',
    link: '#22D3EE',
    card: '#0D3E43',
    heroStart: '#0B3A3F',
    heroEnd: '#061F22',
    overlay: 'rgba(1, 10, 11, 0.28)',
  },
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
};

export const Fonts = {
  regular: fontFamilies.regular,
  semibold: fontFamilies.semibold,
  bold: fontFamilies.bold,
  mono: fontFamilies.mono,
};

function createNavigationTheme(theme: typeof Colors.light, baseTheme: Theme): Theme {
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: theme.background,
      border: theme.border,
      card: theme.surface,
      notification: theme.destructive,
      primary: theme.primary,
      text: theme.text,
    },
  };
}

export const NavigationThemes = {
  dark: createNavigationTheme(Colors.dark, DarkTheme),
  light: createNavigationTheme(Colors.light, DefaultTheme),
};