import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';

import { loginSchema, type LoginInput } from '@/src/schemas/auth';
import { usePatientAuth } from '@/src/features/patient-auth/use-patient-auth';
import { AppButton } from '@/src/ui/button';
import { AppTextField } from '@/src/ui/text-field';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

export function PatientLoginScreen() {
  const router = useRouter();
  const { loginMutation } = usePatientAuth();
  const form = useForm<LoginInput>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await loginMutation.mutateAsync(values);
    router.replace('/');
  });

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Iniciar sesion</ThemedText>
        <ThemedText>Accede al flujo del paciente con tu correo y contrasena registrada.</ThemedText>
      </ThemedView>

      <ThemedView style={styles.form}>
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
          <ThemedText>
            Asegurate de tener `EXPO_PUBLIC_API_URL` configurada apuntando al backend con el prefijo
            `/v1`.
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
    gap: 24,
    padding: 24,
  },
  header: {
    gap: 8,
  },
  form: {
    gap: 16,
  },
  footer: {
    alignItems: 'center',
    gap: 8,
  },
  errorMessage: {
    color: '#D14343',
  },
});