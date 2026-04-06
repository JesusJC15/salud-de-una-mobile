import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { Pressable, StyleProp, StyleSheet, useColorScheme, ViewStyle } from 'react-native';

import { Radius } from '@/src/constants/theme';
import { ThemedText } from '@/src/ui/themed-text';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

type DashboardButtonVariant = 'primary' | 'secondary' | 'destructive' | 'outline';
type DashboardButtonLayout = 'stacked' | 'inline';

type DashboardButtonProps = {
  label: string;
  onPress?: () => void;
  iconName?: IconName;
  variant?: DashboardButtonVariant;
  layout?: DashboardButtonLayout;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

const buttonPalette = {
  light: {
    destructive: { background: '#DC2626', border: '#DC2626', text: '#FFFFFF' },
    outline: { background: '#FFFFFF', border: '#D0D5DD', text: '#344054' },
    primary: { background: '#1E63D6', border: '#1E63D6', text: '#FFFFFF' },
    secondary: { background: '#F2F4F7', border: '#E4E7EC', text: '#344054' },
  },
  dark: {
    destructive: { background: '#EF4444', border: '#EF4444', text: '#111827' },
    outline: { background: '#0F172A', border: '#374151', text: '#E5E7EB' },
    primary: { background: '#60A5FA', border: '#60A5FA', text: '#111827' },
    secondary: { background: '#1F2937', border: '#374151', text: '#E5E7EB' },
  },
} as const;

export function DashboardButton({
  label,
  onPress,
  iconName,
  variant = 'secondary',
  layout = 'inline',
  accessibilityLabel,
  style,
  disabled = false,
}: DashboardButtonProps) {
  const colorScheme = useColorScheme();
  const mode = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = buttonPalette[mode][variant];

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        layout === 'stacked' ? styles.stacked : styles.inline,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: disabled ? 0.55 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}>
      {iconName ? (
        <MaterialIcons
          color={palette.text}
          name={iconName}
          size={layout === 'stacked' ? 24 : 18}
          style={layout === 'stacked' ? styles.stackedIcon : styles.inlineIcon}
        />
      ) : null}
      <ThemedText
        style={[
          layout === 'stacked' ? styles.stackedLabel : styles.inlineLabel,
          { color: palette.text },
        ]}
        type="defaultSemiBold">
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
  },
  inline: {
    flexDirection: 'row',
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineIcon: {
    marginRight: 6,
  },
  inlineLabel: {
    fontSize: 13,
    lineHeight: 16,
  },
  stacked: {
    minHeight: 112,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  stackedIcon: {
    marginBottom: 10,
  },
  stackedLabel: {
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
});
