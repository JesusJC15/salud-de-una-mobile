import { MaterialIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Radius } from '@/src/constants/theme';
import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { getHumanReadableApiError } from '@/src/lib/get-human-readable-api-error';
import { loginSchema, type LoginInput } from '@/src/schemas/auth';
import { usePatientAuth } from '@/src/features/patient-auth/use-patient-auth';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

export function PatientLoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { loginMutation } = usePatientAuth();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginInput>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  });

  const titleColor = isDark ? '#F1F5F9' : '#0F172A';
  const subtitleColor = isDark ? '#94A3B8' : '#64748B';
  const labelColor = isDark ? '#CBD5E1' : '#334155';
  const surfaceBase = isDark ? '#082F32' : '#F0F9FA';
  const cardBackground = isDark ? 'rgba(8, 47, 50, 0.68)' : 'rgba(240, 249, 250, 0.46)';
  const fieldBackground = isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)';
  const fieldBorder = isDark ? '#334155' : '#E2E8F0';
  const iconColor = isDark ? 'rgba(20, 184, 166, 0.78)' : 'rgba(20, 184, 166, 0.62)';
  const accentColor = '#14B8A6';
  const linkColor = '#0891B2';
  const decorativePrimary = isDark ? 'rgba(8, 145, 178, 0.2)' : 'rgba(8, 145, 178, 0.1)';
  const decorativeSecondary = isDark ? 'rgba(20, 184, 166, 0.17)' : 'rgba(20, 184, 166, 0.1)';
  const decorativeTertiary = isDark ? 'rgba(8, 145, 178, 0.12)' : 'rgba(8, 145, 178, 0.08)';
  const inputTextColor = isDark ? '#F1F5F9' : '#0F172A';
  const placeholderColor = '#94A3B8';
  const errorColor = '#DC2626';
  const cardBorderColor = isDark ? 'rgba(51, 65, 85, 0.65)' : 'rgba(226, 232, 240, 0.9)';
  const authErrorMessage = loginMutation.error ? getHumanReadableApiError(loginMutation.error) : null;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await loginMutation.mutateAsync(values);
      router.replace('/');
    } catch {
      // El estado de error de la mutacion se renderiza en la UI.
    }
  });

  return (
    <ThemedView darkColor={surfaceBase} lightColor={surfaceBase} style={styles.container}>
      <View pointerEvents="none" style={[styles.decorativeOrbLeft, { backgroundColor: decorativeSecondary }]} />
      <View pointerEvents="none" style={[styles.decorativeOrbRight, { backgroundColor: decorativePrimary }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" bounces={false}>

          <ThemedView style={styles.header}>
            <View style={[styles.logoWrapper, { backgroundColor: decorativeSecondary }]}>
              <MaterialIcons color={accentColor} name="health-and-safety" size={56} />
              <View pointerEvents="none" style={[styles.logoOverlay, { backgroundColor: decorativeTertiary }]} />
            </View>
            <ThemedText style={[styles.brand, { color: titleColor }]}>SaludDeUna</ThemedText>
            <ThemedText style={[styles.tagline, { color: subtitleColor }]}>Tu salud, en un solo lugar</ThemedText>
          </ThemedView>

          <ThemedView style={styles.introBlock}>
            <ThemedText style={[styles.welcomeTitle, { color: titleColor }]}>Bienvenido de nuevo</ThemedText>
            <ThemedText style={[styles.welcomeSubtitle, { color: subtitleColor }]}>
              Ingresa tus credenciales para continuar
            </ThemedText>
          </ThemedView>

          <ThemedView style={[styles.formCard, { backgroundColor: cardBackground, borderColor: cardBorderColor }]}>
            <Controller
              control={form.control}
              name="email"
              render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <ThemedView style={styles.fieldBlock}>
                  <ThemedText style={[styles.fieldLabel, { color: labelColor }]}>Correo electronico</ThemedText>
                  <ThemedView
                    lightColor={fieldBackground}
                    darkColor={fieldBackground}
                    style={[
                      styles.inputShell,
                      {
                        borderColor: error?.message ? errorColor : fieldBorder,
                      },
                    ]}>
                    <MaterialIcons color={iconColor} name="mail" size={22} />
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="ejemplo@correo.com"
                      placeholderTextColor={placeholderColor}
                      selectionColor={accentColor}
                      style={[styles.input, { color: inputTextColor }]}
                      value={value}
                    />
                  </ThemedView>
                  {error?.message ? <ThemedText style={[styles.inlineError, { color: errorColor }]}>{error.message}</ThemedText> : null}
                </ThemedView>
              )}
            />

            <Controller
              control={form.control}
              name="password"
              render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <ThemedView style={styles.fieldBlock}>
                  <ThemedText style={[styles.fieldLabel, { color: labelColor }]}>Contrasena</ThemedText>
                  <ThemedView
                    lightColor={fieldBackground}
                    darkColor={fieldBackground}
                    style={[
                      styles.inputShell,
                      {
                        borderColor: error?.message ? errorColor : fieldBorder,
                      },
                    ]}>
                    <MaterialIcons color={iconColor} name="lock" size={22} />
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="********"
                      placeholderTextColor={placeholderColor}
                      secureTextEntry={!showPassword}
                      selectionColor={accentColor}
                      style={[styles.input, styles.passwordInput, { color: inputTextColor }]}
                      value={value}
                    />
                    <Pressable
                      accessibilityRole="button"
                      hitSlop={10}
                      onPress={() => setShowPassword((prev) => !prev)}
                      style={styles.visibilityButton}>
                      <MaterialIcons
                        color={subtitleColor}
                        name={showPassword ? 'visibility-off' : 'visibility'}
                        size={22}
                      />
                    </Pressable>
                  </ThemedView>
                  {error?.message ? <ThemedText style={[styles.inlineError, { color: errorColor }]}>{error.message}</ThemedText> : null}
                </ThemedView>
              )}
            />

            <Pressable accessibilityRole="button" style={styles.forgotPasswordButton}>
              <ThemedText style={[styles.forgotPasswordText, { color: linkColor }]}>Olvide mi contrasena</ThemedText>
            </Pressable>

            {authErrorMessage ? (
              <ThemedView
                darkColor="rgba(127, 29, 29, 0.24)"
                lightColor="#FEF2F2"
                style={[
                  styles.authErrorCard,
                  {
                    borderColor: isDark ? 'rgba(248, 113, 113, 0.55)' : '#FECACA',
                  },
                ]}>
                <View style={styles.authErrorHeader}>
                  <MaterialIcons color={errorColor} name="error-outline" size={18} />
                  <ThemedText darkColor="#FECACA" lightColor="#B91C1C" style={styles.authErrorTitle} type="defaultSemiBold">
                    No pudimos iniciar sesion
                  </ThemedText>
                </View>
                <ThemedText darkColor="#FECACA" lightColor="#B91C1C" style={styles.authError}>
                  {authErrorMessage}
                </ThemedText>
                <ThemedText darkColor="#FCA5A5" lightColor="#7F1D1D" style={styles.authErrorHint}>
                  Verifica tu correo y contrasena e intenta de nuevo.
                </ThemedText>
              </ThemedView>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={loginMutation.isPending}
              onPress={() => void onSubmit()}
              style={({ pressed }) => [
                styles.loginButton,
                {
                  borderColor: pressed ? '#0B819D' : accentColor,
                  opacity: loginMutation.isPending ? 0.7 : 1,
                },
              ]}>
              <LinearGradient
                colors={['#14B8A6', '#0891B2']}
                end={{ x: 1, y: 0.5 }}
                start={{ x: 0, y: 0.5 }}
                style={styles.loginButtonGradient}>
                {loginMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.loginButtonText}>Entrar</ThemedText>
                )}
              </LinearGradient>
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.footer}>
            <ThemedText style={{ color: subtitleColor }}>No tienes una cuenta?</ThemedText>
            <Link href="./register">
              <ThemedText style={[styles.createAccountLink, { color: linkColor }]} type="link">
                Crear una cuenta
              </ThemedText>
            </Link>
          </ThemedView>

          <MaterialIcons
            color={decorativeSecondary}
            name="medical-services"
            size={72}
            style={styles.bottomRightDecoration}
          />
          <MaterialIcons color={decorativePrimary} name="healing" size={64} style={styles.leftDecoration} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 28,
  },
  decorativeOrbLeft: {
    borderRadius: Radius.pill,
    height: 320,
    left: -110,
    position: 'absolute',
    top: -90,
    width: 320,
  },
  decorativeOrbRight: {
    borderRadius: Radius.pill,
    bottom: 88,
    height: 360,
    position: 'absolute',
    right: -170,
    width: 360,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 8,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  topBarTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  topBarSpacer: {
    height: 42,
    width: 42,
  },
  header: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 24,
  },
  logoWrapper: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 110,
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
    width: 110,
  },
  logoOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  brand: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginTop: 4,
  },
  introBlock: {
    backgroundColor: 'transparent',
    gap: 4,
    marginBottom: 18,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  welcomeSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: Radius.xxl,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 2,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  fieldBlock: {
    backgroundColor: 'transparent',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 2,
  },
  inputShell: {
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    minHeight: 52,
    paddingVertical: 10,
  },
  passwordInput: {
    paddingRight: 4,
  },
  visibilityButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    minWidth: 32,
  },
  inlineError: {
    fontSize: 13,
    lineHeight: 18,
  },
  forgotPasswordButton: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  authError: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  authErrorCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  authErrorHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  authErrorHint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  authErrorTitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 22,
  },
  createAccountLink: {
    fontSize: 15,
    fontWeight: '800',
  },
  loginButton: {
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 2,
    minHeight: 56,
    overflow: 'hidden',
    position: 'relative',
  },
  loginButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  bottomRightDecoration: {
    bottom: 4,
    opacity: 0.24,
    position: 'absolute',
    right: 0,
    transform: [{ rotate: '-10deg' }],
  },
  leftDecoration: {
    left: 0,
    opacity: 0.18,
    position: 'absolute',
    top: '36%',
    transform: [{ rotate: '12deg' }],
  },
});