import { zodResolver } from '@hookform/resolvers/zod';
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
import { LinearGradient } from 'expo-linear-gradient';

import { Radius } from '@/src/constants/theme';
import { registerSchema, type RegisterInput } from '@/src/schemas/auth';
import { usePatientAuth } from '@/src/features/patient-auth/use-patient-auth';
import { AppTextField } from '@/src/ui/text-field';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';


export function PatientRegisterScreen() {
  const router = useRouter();
  const { registerMutation } = usePatientAuth();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<RegisterInput>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await registerMutation.mutateAsync(values);
    router.replace('/');
  });

  return (
    <LinearGradient
      colors={["#F0F9FA", "#E0F2F1"]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.gradientBg}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bounces={false}>
          <ThemedView style={styles.header}>
            <ThemedText type="eyebrow">Nuevo paciente</ThemedText>
            <ThemedText type="title">Crear cuenta</ThemedText>
            <ThemedText type="muted">
              Registro inicial alineado con las validaciones del backend y el dominio del portal web.
            </ThemedText>
          </ThemedView>

          <ThemedView lightColor="#FCFFFF" darkColor="#0D3E43" style={styles.formCard}>
            <Controller
              control={form.control}
              name="firstName"
              render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <AppTextField
                  autoCapitalize="words"
                  label="Nombre"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={error?.message}
                  placeholder="Ana"
                />
              )}
            />

            <Controller
              control={form.control}
              name="lastName"
              render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <AppTextField
                  autoCapitalize="words"
                  label="Apellido"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={error?.message}
                  placeholder="Gomez"
                />
              )}
            />

            <Controller
              control={form.control}
              name="email"
              render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <AppTextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  label="Correo"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={error?.message}
                  placeholder="paciente@saluddeuna.com"
                />
              )}
            />

            <Controller
              control={form.control}
              name="password"
              render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <View style={{ position: 'relative' }}>
                  <AppTextField
                    autoCapitalize="none"
                    autoCorrect={false}
                    label="Contrasena"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    errorMessage={error?.message}
                    placeholder="********"
                    secureTextEntry={!showPassword}
                  />
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.visibilityButton}
                  >
                    <ThemedText style={styles.visibilityIcon}>{showPassword ? '🙈' : '👁️'}</ThemedText>
                  </Pressable>
                </View>
              )}
            />

            <ThemedText type="muted">
              La contrasena debe incluir al menos 8 caracteres, una mayuscula, un numero y un caracter especial.
            </ThemedText>
            <ThemedText type="muted">
              Si el registro es exitoso, la app iniciara sesion automaticamente con el mismo correo y contrasena.
            </ThemedText>

            {registerMutation.error instanceof Error ? (
              <ThemedText style={styles.errorMessage}>{registerMutation.error.message}</ThemedText>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={registerMutation.isPending}
              onPress={() => void onSubmit()}
              style={({ pressed }) => [
                styles.registerButton,
                { opacity: registerMutation.isPending ? 0.7 : 1, backgroundColor: pressed ? '#0B819D' : '#0891B2' },
              ]}
            >
              <LinearGradient
                colors={["#14B8A6", "#0891B2"]}
                end={{ x: 1, y: 0.5 }}
                start={{ x: 0, y: 0.5 }}
                style={styles.registerButtonGradient}
              >
                {registerMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.registerButtonText}>Crear cuenta</ThemedText>
                )}
              </LinearGradient>
            </Pressable>
          </ThemedView>

          <ThemedView style={styles.footer}>
            <ThemedText>Ya tienes cuenta?</ThemedText>
            <Link href="./login">
              <ThemedText type="link">Iniciar sesion</ThemedText>
            </Link>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
    minHeight: 884,
    width: '100%',
  },
  content: {
    gap: 24,
    minHeight: 1120,
    padding: 24,
    width: 390,
    alignSelf: 'center',
  },
  header: {
    gap: 8,
    marginTop: 24,
    marginBottom: 8,
  },
  formCard: {
    borderRadius: Radius.xl,
    gap: 16,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  footer: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 24,
    marginTop: 18,
  },
  errorMessage: {
    color: '#D14343',
  },
  registerButton: {
    alignItems: 'center',
    borderRadius: Radius.lg,
    justifyContent: 'center',
    marginTop: 2,
    minHeight: 56,
    overflow: 'hidden',
    position: 'relative',
  },
  registerButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  visibilityButton: {
    position: 'absolute',
    right: 8,
    top: 38,
    zIndex: 2,
    padding: 4,
  },
  visibilityIcon: {
    fontSize: 20,
  },
});