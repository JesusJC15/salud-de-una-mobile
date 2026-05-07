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
import { loginSchema, type LoginInput } from '@/src/schemas/auth';
import { usePatientAuth } from '@/src/features/patient-auth/use-patient-auth';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

export function PatientLoginScreen() {
  const router = useRouter();
  const { loginMutation, loginWithEmailMutation, isReady } = usePatientAuth();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginInput>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  });

  const anyPending = loginWithEmailMutation.isPending || loginMutation.isPending;
  const formError = loginWithEmailMutation.error instanceof Error ? loginWithEmailMutation.error.message : null;
  const auth0Error = loginMutation.error instanceof Error ? loginMutation.error.message : null;

  const titleColor = '#0F172A';
  const subtitleColor = '#64748B';
  const labelColor = '#334155';
  const surfaceBase = '#F0F9FA';
  const cardBackground = 'rgba(240, 249, 250, 0.46)';
  const fieldBackground = 'rgba(255, 255, 255, 0.8)';
  const fieldBorder = '#E2E8F0';
  const iconColor = 'rgba(20, 184, 166, 0.62)';
  const accentColor = '#14B8A6';
  const linkColor = '#0891B2';
  const decorativePrimary = 'rgba(8, 145, 178, 0.1)';
  const decorativeSecondary = 'rgba(20, 184, 166, 0.1)';
  const decorativeTertiary = 'rgba(8, 145, 178, 0.08)';
  const inputTextColor = '#0F172A';
  const placeholderColor = '#94A3B8';
  const errorColor = '#DC2626';
  const cardBorderColor = 'rgba(226, 232, 240, 0.9)';

  const onSubmit = form.handleSubmit(async (values) => {
    await loginWithEmailMutation.mutateAsync(values);
    router.replace('/');
  });

  const onAuth0Login = async () => {
    await loginMutation.mutateAsync();
    router.replace('/');
  };

  return (
    <ThemedView lightColor={surfaceBase} style={styles.container}>
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

            {formError ? (
              <ThemedText style={[styles.authError, { color: errorColor }]}>{formError}</ThemedText>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={anyPending}
              onPress={() => void onSubmit()}
              style={({ pressed }) => [
                styles.loginButton,
                {
                  borderColor: pressed ? '#0B819D' : accentColor,
                  opacity: anyPending ? 0.7 : 1,
                },
              ]}>
              <LinearGradient
                colors={['#14B8A6', '#0891B2']}
                end={{ x: 1, y: 0.5 }}
                start={{ x: 0, y: 0.5 }}
                style={styles.loginButtonGradient}>
                {loginWithEmailMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.loginButtonText}>Entrar</ThemedText>
                )}
              </LinearGradient>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: fieldBorder }]} />
              <ThemedText style={[styles.dividerText, { color: subtitleColor }]}>o</ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: fieldBorder }]} />
            </View>

            {auth0Error ? (
              <ThemedText style={[styles.authError, { color: errorColor }]}>{auth0Error}</ThemedText>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={anyPending || !isReady}
              onPress={() => void onAuth0Login()}
              style={({ pressed }) => [
                styles.auth0Button,
                { borderColor: pressed ? '#0B819D' : fieldBorder, opacity: anyPending || !isReady ? 0.7 : 1 },
              ]}>
              {loginMutation.isPending ? (
                <ActivityIndicator color={accentColor} />
              ) : (
                <ThemedText style={[styles.auth0ButtonText, { color: accentColor }]}>Continuar con Auth0</ThemedText>
              )}
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
    ...StyleSheet.absoluteFill,
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
    borderRadius: Radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  auth0ButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
