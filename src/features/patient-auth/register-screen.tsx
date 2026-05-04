import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState, type ComponentProps, type Dispatch, type SetStateAction } from 'react';
import {
  Controller,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  useController,
  useForm,
} from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  type PressableStateCallbackType,
  View,
} from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

import { Radius } from '@/src/constants/theme';
import { type RegisterFormInput, registerFormSchema } from '@/src/schemas/auth';
import { normalizeRegisterInput } from '@/src/features/patient-auth/register-payload';
import { usePatientAuth } from '@/src/features/patient-auth/use-patient-auth';
import { USER_GENDER_LABELS, type UserGender } from '@/src/types/enums';
import { AppIconTextField } from '@/src/ui/icon-text-field';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

const GENDER_OPTIONS: UserGender[] = ['MALE', 'FEMALE', 'OTHER'];
type RegisterFormValues = z.input<typeof registerFormSchema>;

const PALETTE = {
  aquamarineColor: '#14B8A6',
  cardBackground: '#FFFFFF',
  cardBorderColor: 'rgba(20, 184, 166, 0.18)',
  gradientColors: ['#F0F9FA', '#E0F2F1'] as const,
  iconTint: '#14B8A6',
  inputBackground: '#FFFFFF',
  inputBorderColor: '#D7E3EC',
  inputTextColor: '#0F172A',
  placeholderColor: '#94A3B8',
  primaryColor: '#0891B2',
  sectionSubtle: '#334155',
  sectionTitleColor: '#0F172A',
  subtitleColor: '#475569',
  titleColor: '#0F172A',
  topBarColor: '#0F172A',
};

const ORB_PRIMARY = 'rgba(8, 145, 178, 0.1)';
const ORB_SECONDARY = 'rgba(20, 184, 166, 0.1)';
const ORB_TERTIARY = 'rgba(20, 184, 166, 0.05)';

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

type BirthDateFieldProps = {
  control: Control<RegisterFormValues>;
  errorColor: string;
  iconTint: string;
  inputBackground: string;
  inputBorderColor: string;
  inputTextColor: string;
  placeholderColor: string;
  primaryColor: string;
  sectionSubtle: string;
  setShowBirthDatePicker: Dispatch<SetStateAction<boolean>>;
  showBirthDatePicker: boolean;
};

type PasswordFieldName = 'password' | 'confirmPassword';
type PasswordFieldIconName = Extract<ComponentProps<typeof MaterialIcons>['name'], 'lock-outline' | 'lock-reset'>;

type PasswordFieldProps = {
  accessibilityHint: string;
  control: Control<RegisterFormValues>;
  errorColor: string;
  hideLabel: string;
  hint?: string;
  iconColor: string;
  iconName: PasswordFieldIconName;
  inputBackgroundColor: string;
  inputBorderColor: string;
  inputTextColor: string;
  label: string;
  labelColor: string;
  name: PasswordFieldName;
  placeholderColor: string;
  primaryColor: string;
  selectionColor: string;
  showLabel: string;
  subtitleColor: string;
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
};

type BirthDateInputProps = {
  errorMessage: string | undefined;
  errorColor: string;
  iconTint: string;
  inputBackground: string;
  inputBorderColor: string;
  inputTextColor: string;
  onBlur: () => void;
  onChange: (value: string | undefined) => void;
  placeholderColor: string;
  pickerValue: Date;
  primaryColor: string;
  setShowBirthDatePicker: Dispatch<SetStateAction<boolean>>;
  showBirthDatePicker: boolean;
  value: string | null | undefined;
};

function BirthDateWebInput(props: Readonly<BirthDateInputProps>) {
  return (
    <>
      <TextInput
        accessibilityLabel="Ingresar fecha de nacimiento"
        onBlur={props.onBlur}
        onChangeText={(text) => {
          const trimmed = text.trim();
          props.onChange(trimmed === '' ? undefined : trimmed);
        }}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={props.placeholderColor}
        value={props.value ?? ''}
        style={[
          styles.datePickerButton,
          {
            backgroundColor: props.inputBackground,
            borderColor: props.errorMessage ? props.errorColor : props.inputBorderColor,
            color: props.inputTextColor,
          },
        ]}
      />

      <ThemedText style={styles.hintText}>Opcional. Ingresa la fecha en formato AAAA-MM-DD.</ThemedText>
    </>
  );
}

function BirthDateNativeInput(props: Readonly<BirthDateInputProps>) {
  return (
    <>
      <Pressable
        accessibilityLabel="Seleccionar fecha de nacimiento"
        accessibilityRole="button"
        onBlur={props.onBlur}
        onPress={() => {
          props.setShowBirthDatePicker(true);
        }}
        style={[
          styles.datePickerButton,
          {
            backgroundColor: props.inputBackground,
            borderColor: props.errorMessage ? props.errorColor : props.inputBorderColor,
          },
        ]}
      >
        <MaterialIcons color={props.iconTint} name="calendar-month" size={20} />
        <ThemedText style={[styles.datePickerText, { color: props.value ? props.inputTextColor : props.placeholderColor }]}>
          {props.value ?? 'Selecciona tu fecha'}
        </ThemedText>
        <MaterialIcons color={props.placeholderColor} name="arrow-drop-down" size={24} />
      </Pressable>

      <ThemedText style={styles.hintText}>Opcional. Elige la fecha desde el selector.</ThemedText>

      {props.showBirthDatePicker ? (
        <DateTimePicker
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          mode="date"
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            if (Platform.OS === 'android') {
              props.setShowBirthDatePicker(false);
            }

            if (event.type !== 'set' || !selectedDate) {
              return;
            }

            props.onChange(formatDateForInput(selectedDate));
          }}
          value={props.pickerValue}
        />
      ) : null}

      {props.showBirthDatePicker && Platform.OS === 'ios' ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => props.setShowBirthDatePicker(false)}
          style={styles.datePickerDoneButton}
        >
          <ThemedText style={[styles.datePickerDoneText, { color: props.primaryColor }]}>Listo</ThemedText>
        </Pressable>
      ) : null}
    </>
  );
}

function BirthDateField(props: Readonly<BirthDateFieldProps>) {
  const { field, fieldState } = useController({
    control: props.control,
    name: 'birthDate',
  });

  const { onBlur, onChange, value } = field;
  const { error } = fieldState;
  const pickerValue = parseDateFromInput(value) ?? new Date(2000, 0, 1);
  const dateInputProps: BirthDateInputProps = {
    errorColor: props.errorColor,
    errorMessage: error?.message,
    iconTint: props.iconTint,
    inputBackground: props.inputBackground,
    inputBorderColor: props.inputBorderColor,
    inputTextColor: props.inputTextColor,
    onBlur,
    onChange,
    pickerValue,
    placeholderColor: props.placeholderColor,
    primaryColor: props.primaryColor,
    setShowBirthDatePicker: props.setShowBirthDatePicker,
    showBirthDatePicker: props.showBirthDatePicker,
    value,
  };

  return (
    <ThemedView style={styles.fieldBlock}>
      <ThemedText style={[styles.fieldLabel, { color: props.sectionSubtle }]}>Fecha de nacimiento</ThemedText>

      {Platform.OS === 'web' ? <BirthDateWebInput {...dateInputProps} /> : <BirthDateNativeInput {...dateInputProps} />}

      {value ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onChange(undefined);
            props.setShowBirthDatePicker(false);
          }}
        >
          <ThemedText style={[styles.clearDateText, { color: props.primaryColor }]}>Limpiar fecha</ThemedText>
        </Pressable>
      ) : null}

      {error?.message ? <ThemedText style={[styles.inlineError, { color: props.errorColor }]}>{error.message}</ThemedText> : null}
    </ThemedView>
  );
}

function PasswordField(props: Readonly<PasswordFieldProps>) {
  const { field, fieldState } = useController({
    control: props.control,
    name: props.name,
  });

  const { onBlur, onChange, value } = field;
  const { error } = fieldState;

  return (
    <AppIconTextField
      autoCapitalize="none"
      autoCorrect={false}
      errorColor={props.errorColor}
      errorMessage={error?.message}
      focusColor={props.primaryColor}
      hint={props.hint}
      iconColor={props.iconColor}
      iconName={props.iconName}
      inputBackgroundColor={props.inputBackgroundColor}
      inputBorderColor={props.inputBorderColor}
      inputTextColor={props.inputTextColor}
      label={props.label}
      labelColor={props.labelColor}
      onBlur={onBlur}
      onChangeText={onChange}
      placeholder="********"
      placeholderColor={props.placeholderColor}
      rightAccessory={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={props.visible ? props.hideLabel : props.showLabel}
          accessibilityHint={props.accessibilityHint}
          accessibilityState={{ selected: props.visible }}
          hitSlop={10}
          onPress={() => props.setVisible((prev) => !prev)}>
          <MaterialIcons color={props.subtitleColor} name={props.visible ? 'visibility-off' : 'visibility'} size={20} />
        </Pressable>
      }
      secureTextEntry={!props.visible}
      selectionColor={props.selectionColor}
      value={value}
    />
  );
}

export function PatientRegisterScreen() {
  const router = useRouter();
  const { registerMutation, registerWithEmailMutation } = usePatientAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues, undefined, RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      birthDate: undefined,
      gender: undefined,
    },
  });

  const {
    aquamarineColor,
    cardBackground,
    cardBorderColor,
    gradientColors,
    iconTint,
    inputBackground,
    inputBorderColor,
    inputTextColor,
    placeholderColor,
    primaryColor,
    sectionSubtle,
    sectionTitleColor,
    subtitleColor,
    titleColor,
    topBarColor,
  } = PALETTE;
  const errorColor = '#DC2626';

  const anyPending = registerWithEmailMutation.isPending || registerMutation.isPending;

  const onSubmit = form.handleSubmit(async (values) => {
    if (!acceptedTerms) {
      setTermsError('Debes aceptar los términos y condiciones para continuar.');
      return;
    }
    setTermsError(null);
    await registerWithEmailMutation.mutateAsync(normalizeRegisterInput(values));
    router.replace('/');
  });

  const onAuth0Register = async () => {
    // Only validate personal info — Auth0 handles email and password.
    const isValid = await form.trigger(['firstName', 'lastName']);
    if (!isValid) return;

    if (!acceptedTerms) {
      setTermsError('Debes aceptar los términos y condiciones para continuar.');
      return;
    }
    setTermsError(null);

    const { firstName, lastName, birthDate, gender } = form.getValues();
    await registerMutation.mutateAsync({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate: birthDate ?? undefined,
      gender,
    });
    router.replace('/');
  };

  return (
    <LinearGradient colors={gradientColors} end={{ x: 1, y: 1 }} start={{ x: 0.1, y: 0 }} style={styles.container}>
      <View pointerEvents="none" style={[styles.orbTopLeft, { backgroundColor: ORB_SECONDARY }]} />
      <View pointerEvents="none" style={[styles.orbBottomRight, { backgroundColor: ORB_PRIMARY }]} />
      <View pointerEvents="none" style={[styles.orbBottomCenter, { backgroundColor: ORB_TERTIARY }]} />

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
              render={(renderProps: { field: ControllerRenderProps<RegisterFormValues, 'firstName'>; fieldState: ControllerFieldState }) => {
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
                    label="Nombre *"
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
              render={(renderProps: { field: ControllerRenderProps<RegisterFormValues, 'lastName'>; fieldState: ControllerFieldState }) => {
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
                    label="Apellido *"
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

            <BirthDateField
              control={form.control}
              errorColor={errorColor}
              iconTint={iconTint}
              inputBackground={inputBackground}
              inputBorderColor={inputBorderColor}
              inputTextColor={inputTextColor}
              placeholderColor={placeholderColor}
              primaryColor={primaryColor}
              sectionSubtle={sectionSubtle}
              setShowBirthDatePicker={setShowBirthDatePicker}
              showBirthDatePicker={showBirthDatePicker}
            />

            <Controller
              control={form.control}
              name="gender"
              render={(renderProps: { field: ControllerRenderProps<RegisterFormValues, 'gender'>; fieldState: ControllerFieldState }) => {
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
              render={(renderProps: { field: ControllerRenderProps<RegisterFormValues, 'email'>; fieldState: ControllerFieldState }) => {
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
                    label="Correo electrónico *"
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

            <PasswordField
              accessibilityHint="Alterna la visibilidad de la contraseña"
              control={form.control}
              errorColor={errorColor}
              hideLabel="Ocultar contraseña"
              hint="Debe tener 8+ caracteres, mayúscula, número y carácter especial."
              iconColor={iconTint}
              iconName="lock-outline"
              inputBackgroundColor={inputBackground}
              inputBorderColor={inputBorderColor}
              inputTextColor={inputTextColor}
              label="Contraseña *"
              labelColor={sectionSubtle}
              name="password"
              placeholderColor={placeholderColor}
              primaryColor={primaryColor}
              selectionColor={aquamarineColor}
              setVisible={setShowPassword}
              showLabel="Mostrar contraseña"
              subtitleColor={subtitleColor}
              visible={showPassword}
            />

            <PasswordField
              accessibilityHint="Alterna la visibilidad de la confirmación de contraseña"
              control={form.control}
              errorColor={errorColor}
              hideLabel="Ocultar confirmación de contraseña"
              iconColor={iconTint}
              iconName="lock-reset"
              inputBackgroundColor={inputBackground}
              inputBorderColor={inputBorderColor}
              inputTextColor={inputTextColor}
              label="Confirmar contraseña *"
              labelColor={sectionSubtle}
              name="confirmPassword"
              placeholderColor={placeholderColor}
              primaryColor={primaryColor}
              selectionColor={aquamarineColor}
              setVisible={setShowConfirmPassword}
              showLabel="Mostrar confirmación de contraseña"
              subtitleColor={subtitleColor}
              visible={showConfirmPassword}
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

            {registerWithEmailMutation.error instanceof Error ? (
              <ThemedText style={[styles.inlineError, { color: errorColor }]}>{registerWithEmailMutation.error.message}</ThemedText>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={anyPending}
              onPress={() => void onSubmit()}
              style={({ pressed }: PressableStateCallbackType) => [styles.registerButton, { opacity: anyPending ? 0.74 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }]}
            >
              <LinearGradient colors={[aquamarineColor, primaryColor]} end={{ x: 1, y: 0.5 }} start={{ x: 0, y: 0.5 }} style={styles.registerButtonGradient}>
                {registerWithEmailMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.registerButtonText}>Registrarme</ThemedText>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: inputBorderColor }]} />
              <ThemedText style={[styles.dividerText, { color: subtitleColor }]}>o</ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: inputBorderColor }]} />
            </View>

            {registerMutation.error instanceof Error ? (
              <ThemedText style={[styles.inlineError, { color: errorColor }]}>{registerMutation.error.message}</ThemedText>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={anyPending}
              onPress={() => void onAuth0Register()}
              style={({ pressed }: PressableStateCallbackType) => [
                styles.auth0Button,
                { borderColor: pressed ? primaryColor : inputBorderColor, opacity: anyPending ? 0.74 : 1 },
              ]}
            >
              {registerMutation.isPending ? (
                <ActivityIndicator color={primaryColor} />
              ) : (
                <ThemedText style={[styles.auth0ButtonText, { color: primaryColor }]}>Registrarme con Auth0</ThemedText>
              )}
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.footer}>
            <ThemedText style={{ color: subtitleColor }}>¿Ya tienes una cuenta?</ThemedText>
            <Link href="./login">
              <ThemedText style={[styles.loginLink, { color: primaryColor }]} type="link">Inicia sesión</ThemedText>
            </Link>
          </ThemedView>

          <MaterialIcons color={ORB_SECONDARY} name="medical-services" size={112} style={styles.bottomDecoration} />
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
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  auth0Button: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  auth0ButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});