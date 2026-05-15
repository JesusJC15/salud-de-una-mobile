import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { billingService } from '@/src/services/billing/billing-service';

import { Radius } from '@/src/constants/theme';
import {
  getInitials,
  getProfileDisplayName,
  translateUserGender,
  translateUserRole,
} from '@/src/lib/identity';
import { translateConsultationSpecialty } from '@/src/lib/consultation-labels';
import { z } from 'zod';
import {
  ChangePasswordFormInput,
  UpdatePatientProfileFormInput,
  changePasswordSchema,
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
  const authMethod = useSessionStore((state) => state.session?.authMethod ?? null);
  const clearSession = useSessionStore((state) => state.clearSession);
  const setProfile = useSessionStore((state) => state.setProfile);
  const patient = useSessionStore((state) => state.profile);
  const isLegacyAuth = authMethod === 'legacy';

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

  const passwordForm = useForm<ChangePasswordFormInput>({
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
    resolver: zodResolver(changePasswordSchema),
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

  const changePasswordMutation = useMutation({
    mutationFn: (values: ChangePasswordFormInput) =>
      authService.updateCurrentPatient({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      passwordForm.reset();
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: () => authService.exportPatientData(),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => authService.anonymizeAccount(),
    onSuccess: async () => {
      queryClient.clear();
      await clearSession();
      router.replace('/(auth)/login');
    },
  });

  function handleDeleteAccount() {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción es irreversible. Todos tus datos serán anonimizados conforme a la Ley 1581 de 2012. ¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => void deleteAccountMutation.mutateAsync(),
        },
      ],
    );
  }

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
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="eyebrow">Cuenta del paciente</ThemedText>
        <ThemedText type="title">Perfil</ThemedText>
        <ThemedText type="muted">
          Vista de perfil del paciente autenticado con datos cargados desde la sesion actual.
        </ThemedText>
      </ThemedView>

      <ThemedView lightColor="#FCFFFF" style={styles.card}>
        <ThemedView lightColor="#D7F3F5" style={styles.avatar}>
          <ThemedText type="subtitle">{initials}</ThemedText>
        </ThemedView>
        <ThemedText type="subtitle">Resumen</ThemedText>
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

        {isLegacyAuth && (
          <ThemedView style={styles.formSection}>
            <ThemedText type="subtitle">Cambiar contraseña</ThemedText>

            <Controller
              control={passwordForm.control}
              name="currentPassword"
              render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <AppTextField
                  autoCapitalize="none"
                  errorMessage={error?.message}
                  label="Contraseña actual"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  secureTextEntry
                  value={value}
                />
              )}
            />

            <Controller
              control={passwordForm.control}
              name="newPassword"
              render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <AppTextField
                  autoCapitalize="none"
                  errorMessage={error?.message}
                  label="Nueva contraseña"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  secureTextEntry
                  value={value}
                />
              )}
            />

            <Controller
              control={passwordForm.control}
              name="confirmNewPassword"
              render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <AppTextField
                  autoCapitalize="none"
                  errorMessage={error?.message}
                  label="Confirmar nueva contraseña"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  secureTextEntry
                  value={value}
                />
              )}
            />

            {changePasswordMutation.isSuccess && (
              <ThemedText style={styles.successMessage}>
                Contraseña actualizada correctamente.
              </ThemedText>
            )}
            {changePasswordMutation.error instanceof Error && (
              <ThemedText style={styles.errorMessage}>
                {changePasswordMutation.error.message}
              </ThemedText>
            )}

            <AppButton
              label="Actualizar contraseña"
              loading={changePasswordMutation.isPending}
              onPress={() =>
                void passwordForm.handleSubmit((values) =>
                  changePasswordMutation.mutateAsync(values)
                )()
              }
            />
          </ThemedView>
        )}

        <AppButton
          label="Recargar perfil"
          loading={profileQuery.isFetching}
          onPress={() => void profileQuery.refetch()}
          variant="secondary"
        />
        <AppButton label="Cerrar sesion" loading={isLoggingOut} onPress={() => void handleLogout()} variant="secondary" />
      </ThemedView>

      <ThemedView lightColor="#FCFFFF" style={styles.card}>
        <ThemedText type="subtitle">Privacidad y datos</ThemedText>
        <ThemedText type="muted">
          Conforme a la Ley 1581 de 2012, podés descargar o eliminar tus datos personales.
        </ThemedText>
        {exportDataMutation.isSuccess && (
          <ThemedText style={styles.successMessage}>Solicitud de exportación recibida.</ThemedText>
        )}
        {exportDataMutation.error instanceof Error && (
          <ThemedText style={styles.errorMessage}>{exportDataMutation.error.message}</ThemedText>
        )}
        <AppButton
          label="Descargar mis datos"
          loading={exportDataMutation.isPending}
          onPress={() => void exportDataMutation.mutateAsync()}
          variant="secondary"
        />
        {deleteAccountMutation.error instanceof Error && (
          <ThemedText style={styles.errorMessage}>{deleteAccountMutation.error.message}</ThemedText>
        )}
        <AppButton
          label="Eliminar mi cuenta"
          loading={deleteAccountMutation.isPending}
          onPress={handleDeleteAccount}
          variant="secondary"
        />
      </ThemedView>

          <TransactionHistorySection />
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

function TransactionHistorySection() {
  const transactionsQuery = useQuery({
    queryKey: ['transactions'],
    queryFn: () => billingService.getMyTransactions(),
    staleTime: 60_000,
  });

  const transactions = transactionsQuery.data ?? [];

  return (
    <ThemedView lightColor="#FCFFFF" style={styles.card}>
      <ThemedText type="subtitle">Mis pagos</ThemedText>
      {transactionsQuery.isLoading && (
        <ThemedText type="muted">Cargando historial...</ThemedText>
      )}
      {!transactionsQuery.isLoading && transactions.length === 0 && (
        <ThemedText type="muted">No tienes pagos registrados aún.</ThemedText>
      )}
      {transactions.slice(0, 10).map((t) => (
        <View key={t.id} style={styles.transactionRow}>
          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold">
              {translateConsultationSpecialty(t.specialty)}
            </ThemedText>
            <ThemedText type="muted" style={{ fontSize: 11 }}>
              {t.createdAt ? new Date(t.createdAt).toLocaleDateString('es-CO') : '—'}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: t.status === 'COMPLETED' ? '#D1FAE5' : '#FEF3C7' }]}>
            <ThemedText style={{ color: t.status === 'COMPLETED' ? '#059669' : '#D97706', fontSize: 11, fontWeight: '700' }}>
              {t.status === 'COMPLETED' ? 'PAGADO' : 'PENDIENTE'}
            </ThemedText>
          </View>
          <ThemedText type="defaultSemiBold" style={{ marginLeft: 8 }}>
            ${t.amount.toLocaleString('es-CO')}
          </ThemedText>
        </View>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
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
  transactionRow: {
    alignItems: 'center',
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingVertical: 8,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
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
