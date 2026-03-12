import { TextInput, type TextInputProps, StyleSheet } from 'react-native';

import { useThemeColor } from '@/src/hooks/use-theme-color';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

type AppTextFieldProps = TextInputProps & {
  label: string;
  errorMessage?: string;
};

export function AppTextField({ label, errorMessage, style, ...props }: AppTextFieldProps) {
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#0F172A' }, 'background');
  const borderColor = useThemeColor({ light: '#D7E3EA', dark: '#334155' }, 'icon');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({ light: '#6B7280', dark: '#94A3B8' }, 'icon');
  const errorColor = '#D14343';

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="defaultSemiBold">{label}</ThemedText>
      <TextInput
        autoCapitalize="none"
        placeholderTextColor={placeholderColor}
        style={[
          styles.input,
          {
            backgroundColor,
            borderColor: errorMessage ? errorColor : borderColor,
            color: textColor,
          },
          style,
        ]}
        {...props}
      />
      {errorMessage ? <ThemedText style={{ color: errorColor }}>{errorMessage}</ThemedText> : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});