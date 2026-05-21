import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
import { AppIconTextField } from '@/src/ui/icon-text-field';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

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
};

const ERROR_COLOR = '#DC2626';

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

export function PatientProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
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
      heightCm: undefined,
      lastName: undefined,
      weightKg: undefined,
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
        heightCm: values.heightCm,
        lastName: values.lastName,
        weightKg: values.weightKg,
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
      heightCm: source.heightCm?.toString() ?? undefined,
      lastName: source.lastName ?? undefined,
      weightKg: source.weightKg?.toString() ?? undefined,
    });
  }, [form, patient, profileQuery.data]);

  const profile = profileQuery.data ?? patient;
  const displayName = getProfileDisplayName(profile);
  const initials = getInitials(profile?.firstName, profile?.lastName);
  const roleLabel = translateUserRole(profile?.role ?? sessionUser?.role ?? null);
  const genderLabel = translateUserGender(profile?.gender);
  const isFormDirty = form.formState.isDirty;
  const iconFieldColors = {
    errorColor: ERROR_COLOR,
    focusColor: PALETTE.primaryColor,
    iconColor: PALETTE.iconTint,
    inputBackgroundColor: PALETTE.inputBackground,
    inputBorderColor: PALETTE.inputBorderColor,
    inputTextColor: PALETTE.inputTextColor,
    labelColor: PALETTE.sectionSubtle,
    placeholderColor: PALETTE.placeholderColor,
    selectionColor: PALETTE.aquamarineColor,
  };

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
      <LinearGradient colors={PALETTE.gradientColors} end={{ x: 1, y: 1 }} start={{ x: 0.1, y: 0 }} style={styles.gradient}>
        <KeyboardAvoidingView behavior="padding" style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={[styles.headerTitle, { color: PALETTE.titleColor }]}>Perfil</ThemedText>
        <ThemedText style={[styles.headerSubtitle, { color: PALETTE.subtitleColor }]}>
          Administra tus datos personales y la seguridad de tu cuenta.
        </ThemedText>
      </ThemedView>

      <ThemedView lightColor={PALETTE.cardBackground} style={styles.card}>
        <View style={styles.profileSummary}>
          <LinearGradient
            colors={[PALETTE.aquamarineColor, PALETTE.primaryColor]}
            style={styles.avatar}
          >
            <ThemedText style={styles.avatarText}>{initials}</ThemedText>
          </LinearGradient>
          <View style={styles.profileSummaryText}>
            <View style={styles.summaryTitleRow}>
              <ThemedText style={styles.summaryName}>{displayName}</ThemedText>
              <View style={styles.roleBadge}>
                <ThemedText style={styles.roleBadgeText}>{roleLabel || 'Paciente'}</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.summarySubtitle}>
              Perfil del paciente
            </ThemedText>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <MaterialIcons color={PALETTE.iconTint} name="badge" size={18} />
            </View>
            <View style={styles.infoText}>
              <ThemedText style={styles.infoLabel}>Nombre</ThemedText>
              <ThemedText style={styles.infoValue}>{displayName}</ThemedText>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <MaterialIcons color={PALETTE.iconTint} name="mail-outline" size={18} />
            </View>
            <View style={styles.infoText}>
              <ThemedText style={styles.infoLabel}>Correo</ThemedText>
              <ThemedText style={styles.infoValue} numberOfLines={1}>
                {profile?.email ?? sessionUser?.email ?? 'Sin datos cargados'}
              </ThemedText>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <MaterialIcons color={PALETTE.iconTint} name="verified-user" size={18} />
            </View>
            <View style={styles.infoText}>
              <ThemedText style={styles.infoLabel}>Rol</ThemedText>
              <ThemedText style={styles.infoValue}>{roleLabel || 'Paciente'}</ThemedText>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <MaterialIcons color={PALETTE.iconTint} name="wc" size={18} />
            </View>
            <View style={styles.infoText}>
              <ThemedText style={styles.infoLabel}>Género</ThemedText>
              <ThemedText style={styles.infoValue}>{genderLabel ?? 'Sin especificar'}</ThemedText>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <MaterialIcons color={PALETTE.iconTint} name="height" size={18} />
            </View>
            <View style={styles.infoText}>
              <ThemedText style={styles.infoLabel}>Altura</ThemedText>
              <ThemedText style={styles.infoValue}>
                {profile?.heightCm ? `${profile.heightCm} cm` : 'Sin especificar'}
              </ThemedText>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <MaterialIcons color={PALETTE.iconTint} name="monitor-weight" size={18} />
            </View>
            <View style={styles.infoText}>
              <ThemedText style={styles.infoLabel}>Peso</ThemedText>
              <ThemedText style={styles.infoValue}>
                {profile?.weightKg ? `${profile.weightKg} kg` : 'Sin especificar'}
              </ThemedText>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <MaterialIcons color={PALETTE.iconTint} name="calculate" size={18} />
            </View>
            <View style={styles.infoText}>
              <ThemedText style={styles.infoLabel}>IMC</ThemedText>
              <ThemedText style={styles.infoValue}>
                {profile?.bmi ? `${profile.bmi} kg/m²` : 'Sin especificar'}
              </ThemedText>
            </View>
          </View>
        </View>
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
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBadge}>
              <MaterialIcons color={PALETTE.iconTint} name="person" size={20} />
            </View>
            <ThemedText style={[styles.sectionTitle, { color: PALETTE.sectionTitleColor }]}>
              Editar perfil
            </ThemedText>
          </View>

          <Controller
            control={form.control}
            name="firstName"
            render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
              <AppIconTextField
                autoCapitalize="words"
                errorMessage={error?.message}
                iconName="badge"
                label="Nombre"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Ej: Ana"
                value={value ?? ''}
                {...iconFieldColors}
              />
            )}
          />

          <Controller
            control={form.control}
            name="lastName"
            render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
              <AppIconTextField
                autoCapitalize="words"
                errorMessage={error?.message}
                iconName="person-outline"
                label="Apellido"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Ej: Gómez"
                value={value ?? ''}
                {...iconFieldColors}
              />
            )}
          />

          <Controller
            control={form.control}
            name="birthDate"
            render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => {
              const pickerValue = parseDateFromInput(value) ?? new Date(2000, 0, 1);

              return (
                <View style={styles.dateField}>
                  <ThemedText style={styles.dateFieldLabel}>Fecha de nacimiento</ThemedText>
                  <Pressable
                    accessibilityLabel="Seleccionar fecha de nacimiento"
                    accessibilityRole="button"
                    onBlur={onBlur}
                    onPress={() => setShowBirthDatePicker(true)}
                    style={[
                      styles.datePickerButton,
                      { borderColor: error?.message ? ERROR_COLOR : PALETTE.inputBorderColor },
                    ]}
                  >
                    <MaterialIcons color={PALETTE.iconTint} name="calendar-month" size={20} />
                    <ThemedText
                      style={[
                        styles.datePickerText,
                        { color: value ? PALETTE.inputTextColor : PALETTE.placeholderColor },
                      ]}
                    >
                      {value ?? 'Selecciona tu fecha'}
                    </ThemedText>
                    <MaterialIcons color={PALETTE.placeholderColor} name="arrow-drop-down" size={24} />
                  </Pressable>

                  <ThemedText style={styles.hintText}>Opcional. Elige la fecha desde el selector.</ThemedText>

                  {showBirthDatePicker ? (
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
                      <ThemedText style={styles.datePickerDoneText}>Listo</ThemedText>
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
                      <ThemedText style={styles.clearDateText}>Limpiar fecha</ThemedText>
                    </Pressable>
                  ) : null}

                  {error?.message ? (
                    <ThemedText style={styles.errorMessage}>{error.message}</ThemedText>
                  ) : null}
                </View>
              );
            }}
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

          <Controller
            control={form.control}
            name="heightCm"
            render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
              <AppIconTextField
                autoCapitalize="none"
                errorMessage={error?.message}
                iconName="height"
                keyboardType="numeric"
                label="Altura (cm)"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Ej: 165"
                value={value?.toString() ?? ''}
                {...iconFieldColors}
              />
            )}
          />

          <Controller
            control={form.control}
            name="weightKg"
            render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
              <AppIconTextField
                autoCapitalize="none"
                errorMessage={error?.message}
                iconName="monitor-weight"
                keyboardType="numeric"
                label="Peso (kg)"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Ej: 62.5"
                value={value?.toString() ?? ''}
                {...iconFieldColors}
              />
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
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBadge}>
                <MaterialIcons color={PALETTE.iconTint} name="lock" size={20} />
              </View>
              <ThemedText style={[styles.sectionTitle, { color: PALETTE.sectionTitleColor }]}>
                Cambiar contraseña
              </ThemedText>
            </View>

            <Controller
              control={passwordForm.control}
              name="currentPassword"
              render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <AppIconTextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  errorMessage={error?.message}
                  iconName="lock-outline"
                  label="Contraseña actual"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="********"
                  rightAccessory={
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={showCurrentPassword ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                      hitSlop={10}
                      onPress={() => setShowCurrentPassword((previous) => !previous)}
                    >
                      <MaterialIcons color={PALETTE.subtitleColor} name={showCurrentPassword ? 'visibility-off' : 'visibility'} size={20} />
                    </Pressable>
                  }
                  secureTextEntry={!showCurrentPassword}
                  value={value}
                  {...iconFieldColors}
                />
              )}
            />

            <Controller
              control={passwordForm.control}
              name="newPassword"
              render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <AppIconTextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  errorMessage={error?.message}
                  hint="Debe tener 8+ caracteres, mayúscula, número y carácter especial."
                  iconName="lock"
                  label="Nueva contraseña"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="********"
                  rightAccessory={
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={showNewPassword ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                      hitSlop={10}
                      onPress={() => setShowNewPassword((previous) => !previous)}
                    >
                      <MaterialIcons color={PALETTE.subtitleColor} name={showNewPassword ? 'visibility-off' : 'visibility'} size={20} />
                    </Pressable>
                  }
                  secureTextEntry={!showNewPassword}
                  value={value}
                  {...iconFieldColors}
                />
              )}
            />

            <Controller
              control={passwordForm.control}
              name="confirmNewPassword"
              render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <AppIconTextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  errorMessage={error?.message}
                  iconName="lock-reset"
                  label="Confirmar nueva contraseña"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="********"
                  rightAccessory={
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={showConfirmNewPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                      hitSlop={10}
                      onPress={() => setShowConfirmNewPassword((previous) => !previous)}
                    >
                      <MaterialIcons color={PALETTE.subtitleColor} name={showConfirmNewPassword ? 'visibility-off' : 'visibility'} size={20} />
                    </Pressable>
                  }
                  secureTextEntry={!showConfirmNewPassword}
                  value={value}
                  {...iconFieldColors}
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
        </KeyboardAvoidingView>
      </LinearGradient>
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
    backgroundColor: PALETTE.gradientColors[0],
  },
  gradient: {
    flex: 1,
  },
  content: {
    minHeight: '100%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  container: {
    gap: 16,
    backgroundColor: 'transparent',
  },
  header: {
    backgroundColor: 'transparent',
    gap: 6,
    marginBottom: 2,
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
  avatar: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  profileSummary: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  profileSummaryText: {
    flex: 1,
    gap: 5,
  },
  summaryTitleRow: {
    alignItems: 'flex-start',
    gap: 8,
  },
  summaryName: {
    color: PALETTE.titleColor,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  summarySubtitle: {
    color: PALETTE.subtitleColor,
    fontSize: 13,
    lineHeight: 18,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6FFFB',
    borderColor: PALETTE.cardBorderColor,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeText: {
    color: PALETTE.primaryColor,
    fontSize: 11,
    fontWeight: '800',
  },
  infoGrid: {
    borderTopColor: '#E2EEF4',
    borderTopWidth: 1,
    gap: 10,
    marginTop: 6,
    paddingTop: 14,
  },
  infoItem: {
    alignItems: 'center',
    backgroundColor: '#F8FCFD',
    borderColor: '#E2EEF4',
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  infoIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    borderRadius: Radius.md,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  infoText: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    color: PALETTE.subtitleColor,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  infoValue: {
    color: PALETTE.titleColor,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  card: {
    backgroundColor: PALETTE.cardBackground,
    borderColor: PALETTE.cardBorderColor,
    borderWidth: 1,
    borderRadius: Radius.xl,
    gap: 10,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  formSection: {
    backgroundColor: 'transparent',
    gap: 14,
    marginTop: 12,
    paddingTop: 4,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 2,
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
    flex: 1,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  errorMessage: {
    color: ERROR_COLOR,
    fontSize: 13,
    lineHeight: 18,
  },
  successMessage: {
    color: '#0F9F8F',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
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
  dateField: {
    gap: 6,
  },
  dateFieldLabel: {
    color: PALETTE.sectionSubtle,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginLeft: 2,
  },
  datePickerButton: {
    alignItems: 'center',
    backgroundColor: PALETTE.inputBackground,
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
    color: PALETTE.primaryColor,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  clearDateText: {
    color: PALETTE.primaryColor,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  hintText: {
    color: PALETTE.subtitleColor,
    fontSize: 12,
    lineHeight: 17,
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderOption: {
    alignItems: 'center',
    backgroundColor: PALETTE.inputBackground,
    borderColor: PALETTE.inputBorderColor,
    borderRadius: Radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  genderOptionSelected: {
    borderColor: PALETTE.primaryColor,
    backgroundColor: PALETTE.primaryColor,
  },
  genderOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
});
