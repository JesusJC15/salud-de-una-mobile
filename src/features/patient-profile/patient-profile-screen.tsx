import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Radius } from '@/src/constants/theme';
import {
  getInitials,
  getProfileDisplayName,
  translateUserGender,
  translateUserRole,
} from '@/src/lib/identity';
import { authService } from '@/src/services/auth/auth-service';
import { useSessionStore } from '@/src/store/session-store';
import { AppButton } from '@/src/ui/button';
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

  const profileQuery = useQuery({
    enabled: Boolean(sessionUser),
    queryFn: authService.getCurrentPatient,
    queryKey: ['patient-profile', sessionUser?.id],
    staleTime: 60_000,
  });

  useEffect(() => {
    if (profileQuery.data) {
      setProfile(profileQuery.data);
    }
  }, [profileQuery.data, setProfile]);

  const profile = profileQuery.data ?? patient;
  const displayName = getProfileDisplayName(profile);
  const initials = getInitials(profile?.firstName, profile?.lastName);
  const roleLabel = translateUserRole(profile?.role ?? sessionUser?.role ?? null);
  const genderLabel = translateUserGender(profile?.gender);

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
        <AppButton
          label="Actualizar perfil"
          loading={profileQuery.isFetching}
          onPress={() => void profileQuery.refetch()}
          variant="secondary"
        />
        <AppButton label="Cerrar sesion" loading={isLoggingOut} onPress={() => void handleLogout()} variant="secondary" />
      </ThemedView>

      <ThemedView lightColor="#FCFFFF" darkColor="#0D3E43" style={styles.card}>
        <ThemedText type="subtitle">Siguiente iteracion</ThemedText>
        <ThemedText>- formulario de edicion con React Hook Form y Zod</ThemedText>
        <ThemedText>- manejo de carga, error y actualizacion optimista</ThemedText>
        <ThemedText>- centro de notificaciones conectado a la API</ThemedText>
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
  errorMessage: {
    color: '#DC2626',
  },
});