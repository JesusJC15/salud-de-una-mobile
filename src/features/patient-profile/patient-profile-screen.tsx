import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Radius } from '@/src/constants/theme';
import {
  getInitials,
  getProfileDisplayName,
  translateUserGender,
  translateUserRole,
} from '@/src/lib/identity';
import { z } from 'zod';
import {
  UpdatePatientProfileFormInput,
  updatePatientProfileSchema,
} from '@/src/schemas/patient-profile';
import { authService } from '@/src/services/auth/auth-service';
import { useSessionStore } from '@/src/store/session-store';
import { AppButton } from '@/src/ui/button';
import { AppTextField } from '@/src/ui/text-field';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

export function PatientProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const sessionUser = useSessionStore((state) => state.session?.user ?? null);
  const clearSession = useSessionStore((state) => state.clearSession);
  const setProfile = useSessionStore((state) => state.setProfile);
  const patient = useSessionStore((state) => state.profile);
  const sessionStatus = useSessionStore((state) => state.status);
  const form = useForm<
    z.input<typeof updatePatientProfileSchema>,
    unknown,
    UpdatePatientProfileFormInput
  >({
    defaultValues: {
      birthDate: undefined,
      firstName: undefined,
      gender: undefined,
      lastName: undefined,
    },
    resolver: zodResolver(updatePatientProfileSchema),
  });

  const profileQuery = useQuery({
    enabled: Boolean(sessionUser),
    queryFn: authService.getCurrentPatient,
    queryKey: ['patient-profile', sessionUser?.id],
    staleTime: 60_000,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (values: UpdatePatientProfileFormInput) =>
      authService.updateCurrentPatient({
        birthDate: values.birthDate,
        firstName: values.firstName,
        gender: values.gender,
        lastName: values.lastName,
      }),
    onSuccess: async (nextProfile) => {
      setProfile(nextProfile);
      await queryClient.invalidateQueries({ queryKey: ['patient-profile', sessionUser?.id] });
    },
  });

  useEffect(() => {
    if (profileQuery.data) {
      setProfile(profileQuery.data);
    }
  }, [profileQuery.data, setProfile]);

  useEffect(() => {
    if (!patient && !profileQuery.data) {
      return;
    }

    const source = profileQuery.data ?? patient;

    if (!source) {
      return;
    }

    form.reset({
      birthDate: source.birthDate?.slice(0, 10) ?? undefined,
      firstName: source.firstName ?? undefined,
      gender: source.gender ?? undefined,
      lastName: source.lastName ?? undefined,
    });
  }, [form, patient, profileQuery.data]);

  const profile = profileQuery.data ?? patient;
  const displayName = getProfileDisplayName(profile);
  const initials = getInitials(profile?.firstName, profile?.lastName);
  const roleLabel = translateUserRole(profile?.role ?? sessionUser?.role ?? null);
  const genderLabel = translateUserGender(profile?.gender);
  const isFormDirty = form.formState.isDirty;

  const onSubmitProfile = form.handleSubmit(async (values) => {
    await updateProfileMutation.mutateAsync(values);
  });

  async function handleLogout() {
    const refreshToken = useSessionStore.getState().session?.refreshToken ?? null;

    setIsLoggingOut(true);

    try {
      await authService.logout(refreshToken);
    } catch {
      // Se prioriza limpiar la sesion local aunque el backend no responda al logout.
    } finally {
      queryClient.clear();
      await clearSession();
      router.replace('/(auth)/login');
      setIsLoggingOut(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="eyebrow">Cuenta del paciente</ThemedText>
        <ThemedText type="title">Perfil</ThemedText>
        <ThemedText type="muted">
          Vista de perfil del paciente autenticado con datos cargados desde la sesion actual.
        </ThemedText>
      </ThemedView>

      <ThemedView lightColor="#FCFFFF" darkColor="#0D3E43" style={styles.card}>
        <ThemedView lightColor="#D7F3F5" darkColor="#0F4952" style={styles.avatar}>
          <ThemedText type="subtitle">{initials}</ThemedText>
        </ThemedView>
        <ThemedText type="subtitle">Resumen</ThemedText>
        <ThemedText>
          Estado de sesion: <ThemedText type="defaultSemiBold">{sessionStatus}</ThemedText>
        </ThemedText>
        <ThemedText>
          Nombre: <ThemedText type="defaultSemiBold">{displayName}</ThemedText>
        </ThemedText>
        <ThemedText>
          Correo: <ThemedText type="defaultSemiBold">{profile?.email ?? sessionUser?.email ?? 'Sin datos cargados'}</ThemedText>
        </ThemedText>
        <ThemedText>
          Rol: <ThemedText type="defaultSemiBold">{roleLabel || 'Paciente'}</ThemedText>
        </ThemedText>
        {genderLabel ? (
          <ThemedText>
            Genero: <ThemedText type="defaultSemiBold">{genderLabel}</ThemedText>
          </ThemedText>
        ) : null}
        {profileQuery.isPending ? (
          <ThemedText type="muted">Actualizando datos del perfil...</ThemedText>
        ) : null}
        {profileQuery.error instanceof Error ? (
          <ThemedText style={styles.errorMessage}>{profileQuery.error.message}</ThemedText>
        ) : null}
        {updateProfileMutation.error instanceof Error ? (
          <ThemedText style={styles.errorMessage}>{updateProfileMutation.error.message}</ThemedText>
        ) : null}
        {updateProfileMutation.isSuccess ? (
          <ThemedText style={styles.successMessage}>Perfil actualizado correctamente.</ThemedText>
        ) : null}

        <ThemedView style={styles.formSection}>
          <ThemedText type="subtitle">Editar perfil</ThemedText>

          <Controller
            control={form.control}
            name="firstName"
            render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
              <AppTextField
                autoCapitalize="words"
                errorMessage={error?.message}
                label="Nombre"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value ?? ''}
              />
            )}
          />

          <Controller
            control={form.control}
            name="lastName"
            render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
              <AppTextField
                autoCapitalize="words"
                errorMessage={error?.message}
                label="Apellido"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value ?? ''}
              />
            )}
          />

          <Controller
            control={form.control}
            name="birthDate"
            render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
              <AppTextField
                autoCapitalize="none"
                errorMessage={error?.message}
                label="Fecha de nacimiento"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="YYYY-MM-DD"
                value={value ?? ''}
              />
            )}
          />

          <Controller
            control={form.control}
            name="gender"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.genderField}>
                <ThemedText>Género</ThemedText>
                <View style={styles.genderOptions}>
                  {(['MALE', 'FEMALE', 'OTHER'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => onChange(option === value ? '' : option)}
                      style={[
                        styles.genderOption,
                        value === option && styles.genderOptionSelected,
                      ]}
                    >
                      <ThemedText
                        style={value === option ? styles.genderOptionTextSelected : undefined}
                      >
                        {option === 'MALE' ? 'Masculino' : option === 'FEMALE' ? 'Femenino' : 'Otro'}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
                {error?.message ? (
                  <ThemedText style={styles.errorMessage}>{error.message}</ThemedText>
                ) : null}
              </View>
            )}
          />

          <AppButton
            disabled={!isFormDirty}
            label="Guardar cambios"
            loading={updateProfileMutation.isPending}
            onPress={() => void onSubmitProfile()}
          />
        </ThemedView>

        <AppButton
          label="Recargar perfil"
          loading={profileQuery.isFetching}
          onPress={() => void profileQuery.refetch()}
          variant="secondary"
        />
        <AppButton label="Cerrar sesion" loading={isLoggingOut} onPress={() => void handleLogout()} variant="secondary" />
      </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    minHeight: '100%',
  },
  container: {
    gap: 16,
    padding: 24,
  },
  header: {
    gap: 8,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 72,
    justifyContent: 'center',
    marginBottom: 8,
    width: 72,
  },
  card: {
    gap: 8,
    borderRadius: Radius.xl,
    padding: 20,
  },
  formSection: {
    gap: 12,
    marginTop: 8,
  },
  errorMessage: {
    color: '#DC2626',
  },
  successMessage: {
    color: '#0F9F8F',
  },
  genderField: {
    gap: 8,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    flex: 1,
    alignItems: 'center',
  },
  genderOptionSelected: {
    borderColor: '#0F9F8F',
    backgroundColor: '#D7F3F5',
  },
  genderOptionTextSelected: {
    color: '#0F4952',
    fontWeight: '600' as const,
  },
});