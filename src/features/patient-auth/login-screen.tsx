import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, StyleSheet } from 'react-native';

import { Radius } from '@/src/constants/theme';
import { appConfig } from '@/src/config/env';
import { loginSchema, type LoginInput } from '@/src/schemas/auth';
import { usePatientAuth } from '@/src/features/patient-auth/use-patient-auth';
import { checkApiConnectivity, type ApiConnectivityCheckResult } from '@/src/services/api/connectivity';
import { AppButton } from '@/src/ui/button';
import { AppTextField } from '@/src/ui/text-field';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

export function PatientLoginScreen() {
  const router = useRouter();
  const { loginMutation } = usePatientAuth();
  const [connectivityResult, setConnectivityResult] = useState<ApiConnectivityCheckResult | null>(null);
  const [isCheckingConnectivity, setIsCheckingConnectivity] = useState(false);
  const form = useForm<LoginInput>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  });

  const webOrigin = useMemo(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return null;
    }

    return window.location.origin;
  }, []);

  const onSubmit = form.handleSubmit(async (values) => {
    await loginMutation.mutateAsync(values);
    router.replace('/');
  });

  async function handleConnectivityCheck() {
    setIsCheckingConnectivity(true);
    setConnectivityResult(null);

    try {
      const result = await checkApiConnectivity();
      setConnectivityResult(result);
    } finally {
      setIsCheckingConnectivity(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="eyebrow">Frontend paciente</ThemedText>
        <ThemedText type="title">Inicia sesion</ThemedText>
        <ThemedText type="muted">
          Accede con tu correo registrado y continua el seguimiento de tu informacion clinica.
        </ThemedText>
      </ThemedView>

      <ThemedView lightColor="#FCFFFF" darkColor="#0D3E43" style={styles.formCard}>
        <ThemedView lightColor="#F7FEFF" darkColor="#0A3438" style={styles.debugCard}>
          <ThemedText type="defaultSemiBold">Diagnostico de API</ThemedText>
          <ThemedText type="muted">apiBaseUrl efectiva: {appConfig.apiBaseUrl  ?? 'No configurada'}</ThemedText>
          {webOrigin ? (
            <ThemedText type="muted">Origen web actual: {webOrigin}. Debe estar permitido por CORS del backend.</ThemedText>
          ) : (
            <ThemedText type="muted">
              En Expo nativo, la API debe ser accesible por IP LAN o por la ruta del emulador; no por localhost.
            </ThemedText>
          )}
          {connectivityResult ? (
            <ThemedText style={connectivityResult.reachable ? styles.successMessage : styles.errorMessage}>
              {connectivityResult.message}
            </ThemedText>
          ) : null}
          <AppButton
            label="Probar conectividad"
            loading={isCheckingConnectivity}
            onPress={() => void handleConnectivityCheck()}
            variant="secondary"
          />
        </ThemedView>

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
            <AppTextField
              autoCapitalize="none"
              autoCorrect={false}
              label="Contrasena"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              errorMessage={error?.message}
              placeholder="********"
              secureTextEntry
            />
          )}
        />

        {loginMutation.error instanceof Error ? (
          <ThemedText style={styles.errorMessage}>{loginMutation.error.message}</ThemedText>
        ) : null}

        {!loginMutation.isPending ? (
          <ThemedText type="muted">
            Verifica que EXPO_PUBLIC_API_URL apunte al backend con el prefijo /v1.
          </ThemedText>
        ) : null}

        <AppButton label="Entrar" onPress={() => void onSubmit()} loading={loginMutation.isPending} />
      </ThemedView>

      <ThemedView style={styles.footer}>
        <ThemedText>Aun no tienes cuenta?</ThemedText>
        <Link href="./register">
          <ThemedText type="link">Crear cuenta</ThemedText>
        </Link>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 28,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    gap: 8,
  },
  formCard: {
    borderRadius: Radius.xl,
    gap: 16,
    padding: 20,
  },
  debugCard: {
    borderRadius: Radius.lg,
    gap: 10,
    padding: 16,
  },
  footer: {
    alignItems: 'center',
    gap: 8,
  },
  errorMessage: {
    color: '#D14343',
  },
  successMessage: {
    color: '#0F9F8F',
  },
});