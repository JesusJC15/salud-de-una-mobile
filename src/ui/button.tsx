import { Pressable, StyleSheet } from 'react-native';

import { useThemeColor } from '@/src/hooks/use-theme-color';
import { ThemedText } from '@/src/ui/themed-text';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: AppButtonProps) {
  const primaryBackground = useThemeColor({ light: '#0A7EA4', dark: '#53B4D3' }, 'tint');
  const secondaryBackground = useThemeColor({ light: '#E6F4FE', dark: '#173B57' }, 'background');
  const secondaryBorder = useThemeColor({ light: '#C1E4F0', dark: '#24577C' }, 'icon');
  const primaryText = '#FFFFFF';
  const secondaryText = useThemeColor({ light: '#0A7EA4', dark: '#D8F1FF' }, 'text');

  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isPrimary ? primaryBackground : secondaryBackground,
          borderColor: isPrimary ? primaryBackground : secondaryBorder,
          opacity: pressed || disabled || loading ? 0.85 : 1,
        },
      ]}>
      <ThemedText
        style={{ color: isPrimary ? primaryText : secondaryText, textAlign: 'center' }}
        type="defaultSemiBold">
        {loading ? 'Procesando...' : label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});