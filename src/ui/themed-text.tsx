import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts } from '@/src/constants/theme';
import { useThemeColor } from '@/src/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'muted' | 'eyebrow';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const colorKey = type === 'muted' ? 'textMuted' : type === 'link' ? 'link' : 'text';
  const color = useThemeColor({ light: lightColor, dark: darkColor }, colorKey);

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'muted' ? styles.muted : undefined,
        type === 'eyebrow' ? styles.eyebrow : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 34,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: Fonts.semibold,
    fontSize: 20,
    lineHeight: 28,
  },
  link: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    lineHeight: 24,
  },
  muted: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  eyebrow: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    letterSpacing: 0.8,
    lineHeight: 18,
    textTransform: 'uppercase',
  },
});