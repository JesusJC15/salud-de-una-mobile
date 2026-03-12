import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { Radius } from '@/src/constants/theme';
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
  const primaryBackground = useThemeColor({}, 'primary');
  const secondaryBackground = useThemeColor({}, 'surface');
  const secondaryBorder = useThemeColor({}, 'border');
  const primaryText = useThemeColor({}, 'primaryForeground');
  const secondaryText = useThemeColor({}, 'secondaryForeground');

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
          opacity: disabled || loading ? 0.55 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? primaryText : secondaryText} />
      ) : (
        <ThemedText
          style={{ color: isPrimary ? primaryText : secondaryText, textAlign: 'center' }}
          type="defaultSemiBold">
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});