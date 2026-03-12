import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet } from 'react-native';

import { registerSchema, type RegisterInput } from '@/src/schemas/auth';
import { usePatientAuth } from '@/src/features/patient-auth/use-patient-auth';
import { AppButton } from '@/src/ui/button';
import { AppTextField } from '@/src/ui/text-field';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

export function PatientRegisterScreen() {
  const router = useRouter();
  const { registerMutation } = usePatientAuth();
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
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Crear cuenta</ThemedText>
        <ThemedText>
          Registro base para paciente alineado con las reglas de validacion del backend.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.form}>
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

        <ThemedText>
          La contrasena debe incluir al menos 8 caracteres, una mayuscula, un numero y un caracter
          especial.
        </ThemedText>
        <ThemedText>
          Si el registro es exitoso, la app iniciara sesion automaticamente con el mismo correo y
          contrasena.
        </ThemedText>

        {registerMutation.error instanceof Error ? (
          <ThemedText style={styles.errorMessage}>{registerMutation.error.message}</ThemedText>
        ) : null}

        <AppButton
          label="Crear cuenta"
          onPress={() => void onSubmit()}
          loading={registerMutation.isPending}
        />
      </ThemedView>

      <ThemedView style={styles.footer}>
        <ThemedText>Ya tienes cuenta?</ThemedText>
        <Link href="./login">
          <ThemedText type="link">Iniciar sesion</ThemedText>
        </Link>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
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
    paddingBottom: 24,
  },
  errorMessage: {
    color: '#D14343',
  },
});