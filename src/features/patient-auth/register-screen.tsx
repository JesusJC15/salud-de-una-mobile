import { MaterialIcons } from '@expo/vector-icons';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Controller,
  type ControllerFieldState,
  type ControllerRenderProps,
  useForm,
} from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  type PressableStateCallbackType,
  View,
} from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';

import { Radius } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { type RegisterInput, registerSchema } from '@/src/schemas/auth';
import { normalizeRegisterInput } from '@/src/features/patient-auth/register-payload';
import { usePatientAuth } from '@/src/features/patient-auth/use-patient-auth';
import { USER_GENDER_LABELS, type UserGender } from '@/src/types/enums';
import { AppIconTextField } from '@/src/ui/icon-text-field';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

// Dynamically load the native DateTimePicker only on non-web platforms to avoid
// bundling/runtime issues when building for web.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let DateTimePicker: any;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const GENDER_OPTIONS: UserGender[] = ['MALE', 'FEMALE', 'OTHER'];

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDateFromInput(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

export function PatientRegisterScreen() {
  const router = useRouter();
  const { registerMutation } = usePatientAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      birthDate: undefined,
      gender: undefined,
    },
  });

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const gradientColors = (isDarkMode
    ? ['#020617', '#0F172A']
    : ['#F0F9FA', '#E0F2F1']) as const;
  const topBarColor = isDarkMode ? '#E5F3FF' : '#0F172A';
  const titleColor = isDarkMode ? '#E5F3FF' : '#0F172A';
  const subtitleColor = isDarkMode ? '#CBD5F5' : '#475569';
  const sectionTitleColor = isDarkMode ? '#E5F3FF' : '#0F172A';
  const sectionSubtle = isDarkMode ? '#94A3B8' : '#334155';
  const cardBackground = isDarkMode ? '#020617' : '#FFFFFF';
  const cardBorderColor = isDarkMode ? 'rgba(148, 163, 184, 0.6)' : 'rgba(20, 184, 166, 0.18)';
  const inputBackground = isDarkMode ? '#020617' : '#FFFFFF';
  const inputBorderColor = isDarkMode ? '#1F2937' : '#D7E3EC';
  const iconTint = isDarkMode ? '#22D3EE' : '#14B8A6';
  const inputTextColor = isDarkMode ? '#E5F3FF' : '#0F172A';
  const placeholderColor = isDarkMode ? '#64748B' : '#94A3B8';
  const errorColor = '#DC2626';
  const primaryColor = isDarkMode ? '#06B6D4' : '#0891B2';
  const aquamarineColor = isDarkMode ? '#22D3EE' : '#14B8A6';
  const orbPrimary = 'rgba(8, 145, 178, 0.1)';
  const orbSecondary = 'rgba(20, 184, 166, 0.1)';
  const orbTertiary = 'rgba(20, 184, 166, 0.05)';

  const onSubmit = form.handleSubmit(async (values) => {
    if (!acceptedTerms) {
      setTermsError('Debes aceptar los términos y condiciones para continuar.');
      return;
    }

    setTermsError(null);

    await registerMutation.mutateAsync(normalizeRegisterInput(values));

    router.replace('/');
  });

  return (
    <LinearGradient colors={gradientColors} end={{ x: 1, y: 1 }} start={{ x: 0.1, y: 0 }} style={styles.container}>
      <View pointerEvents="none" style={[styles.orbTopLeft, { backgroundColor: orbSecondary }]} />
      <View pointerEvents="none" style={[styles.orbBottomRight, { backgroundColor: orbPrimary }]} />
      <View pointerEvents="none" style={[styles.orbBottomCenter, { backgroundColor: orbTertiary }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView bounces={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedView style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                  return;
                }
                router.replace('/(auth)/login');
              }}
              style={[styles.circleButton, { backgroundColor: cardBackground, borderColor: cardBorderColor }]}
            >
              <MaterialIcons color={topBarColor} name="arrow-back" size={22} />
            </Pressable>

            <ThemedView style={styles.brandBlock}>
              <View style={styles.brandIconBadge}>
                <MaterialIcons color="#FFFFFF" name="health-and-safety" size={18} />
              </View>
              <ThemedText style={[styles.brandText, { color: primaryColor }]}>SaludDeUna</ThemedText>
            </ThemedView>

            <View style={styles.topBarSpacer} />
          </ThemedView>

          <ThemedView style={styles.header}>
            <ThemedText style={[styles.headerTitle, { color: titleColor }]}>Registro de Paciente</ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: subtitleColor }]}>Crea tu cuenta para acceder a tus servicios médicos.</ThemedText>
          </ThemedView>

          <ThemedView style={[styles.sectionCard, { backgroundColor: cardBackground, borderColor: cardBorderColor }]}>
            <ThemedView style={styles.sectionHeader}>
              <View style={styles.sectionIconBadge}>
                <MaterialIcons color={iconTint} name="person" size={20} />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>Datos personales</ThemedText>
            </ThemedView>

            <Controller
              control={form.control}
              name="firstName"
              render={(renderProps: { field: ControllerRenderProps<RegisterInput, 'firstName'>; fieldState: ControllerFieldState }) => {
                const { onBlur, onChange, value } = renderProps.field;
                const { error } = renderProps.fieldState;

                return (
                  <AppIconTextField
                    autoCapitalize="words"
                    errorColor={errorColor}
                    errorMessage={error?.message}
                    focusColor={primaryColor}
                    iconColor={iconTint}
                    iconName="badge"
                    inputBackgroundColor={inputBackground}
                    inputBorderColor={inputBorderColor}
                    inputTextColor={inputTextColor}
                    label="Nombre"
                    labelColor={sectionSubtle}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Ej: Ana"
                    placeholderColor={placeholderColor}
                    selectionColor={aquamarineColor}
                    value={value}
                  />
                );
              }}
            />

            <Controller
              control={form.control}
              name="lastName"
              render={(renderProps: { field: ControllerRenderProps<RegisterInput, 'lastName'>; fieldState: ControllerFieldState }) => {
                const { onBlur, onChange, value } = renderProps.field;
                const { error } = renderProps.fieldState;

                return (
                  <AppIconTextField
                    autoCapitalize="words"
                    errorColor={errorColor}
                    errorMessage={error?.message}
                    focusColor={primaryColor}
                    iconColor={iconTint}
                    iconName="person-outline"
                    inputBackgroundColor={inputBackground}
                    inputBorderColor={inputBorderColor}
                    inputTextColor={inputTextColor}
                    label="Apellido"
                    labelColor={sectionSubtle}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Ej: Gómez"
                    placeholderColor={placeholderColor}
                    selectionColor={aquamarineColor}
                    value={value}
                  />
                );
              }}
            />

            <Controller
              control={form.control}
              name="birthDate"
              render={(renderProps: { field: ControllerRenderProps<RegisterInput, 'birthDate'>; fieldState: ControllerFieldState }) => {
                const { onBlur, onChange, value } = renderProps.field;
                const { error } = renderProps.fieldState;
                const pickerValue = parseDateFromInput(value) ?? new Date(2000, 0, 1);

                return (
                  <ThemedView style={styles.fieldBlock}>
                    <ThemedText style={[styles.fieldLabel, { color: sectionSubtle }]}>Fecha de nacimiento</ThemedText>

                    <Pressable
                      accessibilityLabel="Seleccionar fecha de nacimiento"
                      accessibilityRole="button"
                      onBlur={onBlur}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          setShowBirthDatePicker(true);
                        }
                      }}
                      style={[
                        styles.datePickerButton,
                        {
                          backgroundColor: inputBackground,
                          borderColor: error?.message ? errorColor : inputBorderColor,
                        },
                      ]}
                    >
                      <MaterialIcons color={iconTint} name="calendar-month" size={20} />
                      <ThemedText style={[styles.datePickerText, { color: value ? inputTextColor : placeholderColor }]}>
                        {value ?? 'Selecciona tu fecha'}
                      </ThemedText>
                      <MaterialIcons color={placeholderColor} name="arrow-drop-down" size={24} />
                    </Pressable>

                    <ThemedText style={styles.hintText}>Opcional. Elige la fecha desde el selector.</ThemedText>

                    {showBirthDatePicker && Platform.OS !== 'web' ? (
                      <DateTimePicker
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        maximumDate={new Date()}
                        mode="date"
                        onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                          if (Platform.OS === 'android') {
                            setShowBirthDatePicker(false);
                          }

                          if (event.type !== 'set' || !selectedDate) {
                            return;
                          }

                          onChange(formatDateForInput(selectedDate));
                        }}
                        value={pickerValue}
                      />
                    ) : null}

                    {showBirthDatePicker && Platform.OS === 'ios' ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setShowBirthDatePicker(false)}
                        style={styles.datePickerDoneButton}
                      >
                        <ThemedText style={[styles.datePickerDoneText, { color: primaryColor }]}>Listo</ThemedText>
                      </Pressable>
                    ) : null}

                    {value ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          onChange(undefined);
                          setShowBirthDatePicker(false);
                        }}
                      >
                        <ThemedText style={[styles.clearDateText, { color: primaryColor }]}>Limpiar fecha</ThemedText>
                      </Pressable>
                    ) : null}

                    {error?.message ? <ThemedText style={[styles.inlineError, { color: errorColor }]}>{error.message}</ThemedText> : null}
                  </ThemedView>
                );
              }}
            />

            <Controller
              control={form.control}
              name="gender"
              render={(renderProps: { field: ControllerRenderProps<RegisterInput, 'gender'>; fieldState: ControllerFieldState }) => {
                const { onChange, value } = renderProps.field;
                const { error } = renderProps.fieldState;

                return (
                  <ThemedView style={styles.fieldBlock}>
                    <ThemedText style={[styles.fieldLabel, { color: sectionSubtle }]}>Género</ThemedText>
                    <ThemedView style={styles.genderGroup} accessibilityRole="radiogroup">
                      {GENDER_OPTIONS.map((option) => {
                        const selected = value === option;

                        return (
                          <Pressable
                            key={option}
                            accessibilityRole="radio"
                            accessibilityState={{ selected }}
                            onPress={() => onChange(option)}
                            style={[
                              styles.genderChip,
                              {
                                backgroundColor: selected ? primaryColor : inputBackground,
                                borderColor: selected ? primaryColor : inputBorderColor,
                              },
                            ]}
                          >
                            <ThemedText style={[styles.genderChipText, { color: selected ? '#FFFFFF' : sectionSubtle }]}>{USER_GENDER_LABELS[option]}</ThemedText>
                          </Pressable>
                        );
                      })}

                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ selected: !value }}
                        onPress={() => onChange(undefined)}
                        style={[
                          styles.genderChip,
                          {
                            backgroundColor: value ? inputBackground : aquamarineColor,
                            borderColor: value ? inputBorderColor : aquamarineColor,
                          },
                        ]}
                      >
                        <ThemedText style={[styles.genderChipText, { color: value ? sectionSubtle : '#FFFFFF' }]}>Prefiero no decir</ThemedText>
                      </Pressable>
                    </ThemedView>
                    {error?.message ? <ThemedText style={[styles.inlineError, { color: errorColor }]}>{error.message}</ThemedText> : null}
                  </ThemedView>
                );
              }}
            />
          </ThemedView>

          <ThemedView style={[styles.sectionCard, { backgroundColor: cardBackground, borderColor: cardBorderColor }]}>
            <ThemedView style={styles.sectionHeader}>
              <View style={styles.sectionIconBadge}>
                <MaterialIcons color={iconTint} name="lock" size={20} />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>Seguridad</ThemedText>
            </ThemedView>

            <Controller
              control={form.control}
              name="email"
              render={(renderProps: { field: ControllerRenderProps<RegisterInput, 'email'>; fieldState: ControllerFieldState }) => {
                const { onBlur, onChange, value } = renderProps.field;
                const { error } = renderProps.fieldState;

                return (
                  <AppIconTextField
                    autoCapitalize="none"
                    autoCorrect={false}
                    errorColor={errorColor}
                    errorMessage={error?.message}
                    focusColor={primaryColor}
                    iconColor={iconTint}
                    iconName="mail-outline"
                    inputBackgroundColor={inputBackground}
                    inputBorderColor={inputBorderColor}
                    inputTextColor={inputTextColor}
                    keyboardType="email-address"
                    label="Correo electrónico"
                    labelColor={sectionSubtle}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="paciente@saluddeuna.com"
                    placeholderColor={placeholderColor}
                    selectionColor={aquamarineColor}
                    value={value}
                  />
                );
              }}
            />

            <Controller
              control={form.control}
              name="password"
              render={(renderProps: { field: ControllerRenderProps<RegisterInput, 'password'>; fieldState: ControllerFieldState }) => {
                const { onBlur, onChange, value } = renderProps.field;
                const { error } = renderProps.fieldState;

                return (
                  <AppIconTextField
                    autoCapitalize="none"
                    autoCorrect={false}
                    errorColor={errorColor}
                    errorMessage={error?.message}
                    focusColor={primaryColor}
                    hint="Debe tener 8+ caracteres, mayúscula, número y carácter especial."
                    iconColor={iconTint}
                    iconName="lock-outline"
                    inputBackgroundColor={inputBackground}
                    inputBorderColor={inputBorderColor}
                    inputTextColor={inputTextColor}
                    label="Contraseña"
                    labelColor={sectionSubtle}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="********"
                    placeholderColor={placeholderColor}
                    rightAccessory={
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        accessibilityHint="Alterna la visibilidad de la contraseña"
                        accessibilityState={{ selected: showPassword }}
                        hitSlop={10}
                        onPress={() => setShowPassword((prev) => !prev)}>
                        <MaterialIcons color={subtitleColor} name={showPassword ? 'visibility-off' : 'visibility'} size={20} />
                      </Pressable>
                    }
                    secureTextEntry={!showPassword}
                    selectionColor={aquamarineColor}
                    value={value}
                  />
                );
              }}
            />

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedTerms }}
              onPress={() => {
                setAcceptedTerms((previous) => !previous);
                setTermsError(null);
              }}
              style={styles.termsRow}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: acceptedTerms ? primaryColor : inputBackground,
                    borderColor: acceptedTerms ? primaryColor : inputBorderColor,
                  },
                ]}
              >
                {acceptedTerms ? <MaterialIcons color="#FFFFFF" name="check" size={14} /> : null}
              </View>

              <ThemedText style={[styles.termsText, { color: subtitleColor }]}>Acepto términos y condiciones y política de privacidad.</ThemedText>
            </Pressable>

            {termsError ? <ThemedText style={[styles.inlineError, { color: errorColor }]}>{termsError}</ThemedText> : null}

            {registerMutation.error instanceof Error ? (
              <ThemedText style={[styles.inlineError, { color: errorColor }]}>{registerMutation.error.message}</ThemedText>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={registerMutation.isPending}
              onPress={() => void onSubmit()}
              style={({ pressed }: PressableStateCallbackType) => [styles.registerButton, { opacity: registerMutation.isPending ? 0.74 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }]}
            >
              <LinearGradient colors={[aquamarineColor, primaryColor]} end={{ x: 1, y: 0.5 }} start={{ x: 0, y: 0.5 }} style={styles.registerButtonGradient}>
                {registerMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.registerButtonText}>Registrarme</ThemedText>
                )}
              </LinearGradient>
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.footer}>
            <ThemedText style={{ color: subtitleColor }}>¿Ya tienes una cuenta?</ThemedText>
            <Link href="./login">
              <ThemedText style={[styles.loginLink, { color: primaryColor }]} type="link">Inicia sesión</ThemedText>
            </Link>
          </ThemedView>

          <MaterialIcons color={orbSecondary} name="medical-services" size={112} style={styles.bottomDecoration} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  orbTopLeft: {
    borderRadius: Radius.pill,
    height: 320,
    left: -130,
    position: 'absolute',
    top: -80,
    width: 320,
  },
  orbBottomRight: {
    borderRadius: Radius.pill,
    bottom: 40,
    height: 360,
    position: 'absolute',
    right: -190,
    width: 360,
  },
  orbBottomCenter: {
    borderRadius: Radius.pill,
    bottom: 8,
    height: 220,
    left: '50%',
    marginLeft: -110,
    position: 'absolute',
    width: 220,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  circleButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  topBarSpacer: {
    height: 42,
    width: 42,
  },
  brandBlock: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 8,
  },
  brandIconBadge: {
    alignItems: 'center',
    backgroundColor: '#14B8A6',
    borderRadius: Radius.md,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  header: {
    backgroundColor: 'transparent',
    gap: 6,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  headerTitle: {
    fontSize: 31,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 37,
  },
  headerSubtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  sectionCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 14,
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  sectionHeader: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 10,
  },
  sectionIconBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
    borderRadius: Radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  fieldBlock: {
    backgroundColor: 'transparent',
    gap: 6,
  },
  datePickerButton: {
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 12,
  },
  datePickerText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  datePickerDoneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  datePickerDoneText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  clearDateText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  hintText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 17,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginLeft: 2,
  },
  inlineError: {
    fontSize: 13,
    lineHeight: 18,
  },
  genderGroup: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderChip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderChipText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  termsRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    marginTop: 1,
    width: 20,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  registerButton: {
    borderRadius: Radius.lg,
    marginTop: 4,
    overflow: 'hidden',
  },
  registerButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 12,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: 8,
    paddingBottom: 10,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '800',
  },
  bottomDecoration: {
    alignSelf: 'center',
    marginTop: 8,
    opacity: 0.35,
  },
});