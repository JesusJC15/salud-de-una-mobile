import { StyleSheet } from 'react-native';

import { useSessionStore } from '@/src/store/session-store';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

export function PatientProfileScreen() {
  const sessionUser = useSessionStore((state) => state.session?.user ?? null);
  const patient = useSessionStore((state) => state.profile);
  const sessionStatus = useSessionStore((state) => state.status);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Perfil</ThemedText>
        <ThemedText>
          Vista de perfil del paciente autenticado con datos cargados desde la sesion actual.
        </ThemedText>
      </ThemedView>

      <ThemedView lightColor="#F5FBFF" darkColor="#16212B" style={styles.card}>
        <ThemedText type="subtitle">Resumen</ThemedText>
        <ThemedText>
          Estado de sesion: <ThemedText type="defaultSemiBold">{sessionStatus}</ThemedText>
        </ThemedText>
        <ThemedText>
          Nombre:{' '}
          <ThemedText type="defaultSemiBold">
            {patient ? `${patient.firstName} ${patient.lastName}` : 'Pendiente de carga'}
          </ThemedText>
        </ThemedText>
        <ThemedText>
          Correo:{' '}
          <ThemedText type="defaultSemiBold">{patient?.email ?? sessionUser?.email ?? 'Sin datos cargados'}</ThemedText>
        </ThemedText>
      </ThemedView>

      <ThemedView lightColor="#F5FBFF" darkColor="#16212B" style={styles.card}>
        <ThemedText type="subtitle">Evolucion prevista</ThemedText>
        <ThemedText>- refresco del perfil desde `GET /patients/me`</ThemedText>
        <ThemedText>- formulario de edicion con React Hook Form y Zod</ThemedText>
        <ThemedText>- manejo de carga, error y actualizacion optimista</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    padding: 24,
  },
  header: {
    gap: 8,
  },
  card: {
    gap: 8,
    borderRadius: 20,
    padding: 20,
  },
});