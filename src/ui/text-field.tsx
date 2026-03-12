import { useState } from 'react';
import { TextInput, type TextInputProps, StyleSheet } from 'react-native';

import { Radius } from '@/src/constants/theme';
import { useThemeColor } from '@/src/hooks/use-theme-color';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

type AppTextFieldProps = TextInputProps & {
  label: string;
  errorMessage?: string;
};

export function AppTextField({ label, errorMessage, style, ...props }: AppTextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const backgroundColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'textMuted');
  const focusColor = useThemeColor({}, 'info');
  const errorColor = useThemeColor({}, 'destructive');

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="defaultSemiBold">{label}</ThemedText>
      <TextInput
        autoCapitalize="none"
        onBlur={(event) => {
          setIsFocused(false);
          props.onBlur?.(event);
        }}
        onFocus={(event) => {
          setIsFocused(true);
          props.onFocus?.(event);
        }}
        placeholderTextColor={placeholderColor}
        selectionColor={focusColor}
        style={[
          styles.input,
          {
            backgroundColor,
            borderColor: errorMessage ? errorColor : isFocused ? focusColor : borderColor,
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
    borderRadius: Radius.lg,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});