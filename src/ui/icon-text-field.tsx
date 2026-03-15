import { MaterialIcons } from '@expo/vector-icons';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { Radius } from '@/src/constants/theme';
import { ThemedText } from '@/src/ui/themed-text';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

type AppIconTextFieldProps = TextInputProps & {
  label: string;
  iconName: MaterialIconName;
  errorMessage?: string;
  hint?: string;
  rightAccessory?: ReactNode;
  labelColor?: string;
  iconColor?: string;
  inputBackgroundColor?: string;
  inputBorderColor?: string;
  inputTextColor?: string;
  placeholderColor?: string;
  focusColor?: string;
  errorColor?: string;
};

export function AppIconTextField({
  label,
  iconName,
  errorMessage,
  hint,
  rightAccessory,
  labelColor = '#334155',
  iconColor = '#14B8A6',
  inputBackgroundColor = '#FFFFFF',
  inputBorderColor = '#D7E3EC',
  inputTextColor = '#0F172A',
  placeholderColor = '#94A3B8',
  focusColor = '#0891B2',
  errorColor = '#DC2626',
  selectionColor,
  onBlur,
  onFocus,
  style,
  value,
  ...props
}: AppIconTextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  let resolvedBorderColor = inputBorderColor;

  if (isFocused) {
    resolvedBorderColor = focusColor;
  }

  if (errorMessage) {
    resolvedBorderColor = errorColor;
  }

  const inputProps: TextInputProps = {
    ...props,
    ...(value !== undefined ? { value: value ?? '' } : {}),
    accessibilityLabel: props.accessibilityLabel ?? label,
    accessibilityHint: props.accessibilityHint ?? hint,
    accessibilityState: {
      ...(props.accessibilityState ?? {}),
      invalid: Boolean(errorMessage),
    },
  };

  return (
    <View style={styles.fieldBlock}>
      <ThemedText style={[styles.fieldLabel, { color: labelColor }]}>{label}</ThemedText>

      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: inputBackgroundColor,
            borderColor: resolvedBorderColor,
          },
        ]}
      >
        <MaterialIcons color={iconColor} name={iconName} size={20} />

        <TextInput
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={placeholderColor}
          selectionColor={selectionColor ?? focusColor}
          style={[styles.input, { color: inputTextColor }, style]}
          {...inputProps}
        />

        {rightAccessory ? <View style={styles.rightAccessory}>{rightAccessory}</View> : null}
      </View>

      {hint ? <ThemedText style={styles.hintText}>{hint}</ThemedText> : null}
      {errorMessage ? <ThemedText style={[styles.errorText, { color: errorColor }]}>{errorMessage}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldBlock: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginLeft: 2,
  },
  inputShell: {
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    minHeight: 50,
    paddingVertical: 8,
  },
  rightAccessory: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    minWidth: 32,
  },
  hintText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 17,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
