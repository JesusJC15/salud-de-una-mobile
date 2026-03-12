import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/src/components/parallax-scroll-view';
import { appConfig } from '@/src/config/env';
import { useSessionStore } from '@/src/store/session-store';
import { AppButton } from '@/src/ui/button';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

type PatientHomeScreenProps = {
  onLoginPress: () => void;
  onRegisterPress: () => void;
};

export function PatientHomeScreen({ onLoginPress, onRegisterPress }: PatientHomeScreenProps) {
  const sessionStatus = useSessionStore((state) => state.status);
  const sessionUser = useSessionStore((state) => state.session?.user ?? null);
  const patientProfile = useSessionStore((state) => state.profile);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E6F4FE', dark: '#102A43' }}
      headerImage={<ThemedView lightColor="#D4EEF8" darkColor="#173B57" style={styles.heroGlow} />}>
      <ThemedView style={styles.heroContent}>
        <ThemedText type="title">Salud De Una</ThemedText>
        <ThemedText>
          Aplicacion movil del paciente construida sobre Expo Router, Query Client y una capa de
          servicios conectada al backend actual.
        </ThemedText>
      </ThemedView>

      <ThemedView lightColor="#F5FBFF" darkColor="#16212B" style={styles.card}>
        <ThemedText type="subtitle">Sesion actual</ThemedText>
        <ThemedText>
          Estado: <ThemedText type="defaultSemiBold">{sessionStatus}</ThemedText>
        </ThemedText>
        <ThemedText>
          Paciente:{' '}
          <ThemedText type="defaultSemiBold">
            {patientProfile
              ? `${patientProfile.firstName} ${patientProfile.lastName}`
              : sessionUser?.email ?? 'Sin sesion activa'}
          </ThemedText>
        </ThemedText>
        {!sessionUser ? (
          <ThemedView style={styles.actions}>
            <AppButton label="Iniciar sesion" onPress={onLoginPress} />
            <AppButton label="Crear cuenta" onPress={onRegisterPress} variant="secondary" />
          </ThemedView>
        ) : null}
      </ThemedView>

      <ThemedView lightColor="#F5FBFF" darkColor="#16212B" style={styles.card}>
        <ThemedText type="subtitle">Configuracion</ThemedText>
        <ThemedText>
          API base:{' '}
          <ThemedText type="defaultSemiBold">{appConfig.apiBaseUrl ?? 'No configurada'}</ThemedText>
        </ThemedText>
        <ThemedText>
          Entorno: <ThemedText type="defaultSemiBold">{appConfig.appEnv}</ThemedText>
        </ThemedText>
      </ThemedView>

      <ThemedView lightColor="#F5FBFF" darkColor="#16212B" style={styles.card}>
        <ThemedText type="subtitle">Capacidades del modulo paciente</ThemedText>
        <ThemedText>- autenticacion y persistencia de sesion</ThemedText>
        <ThemedText>- perfil de paciente con estado local sincronizado</ThemedText>
        <ThemedText>- base lista para integrar notificaciones</ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  heroGlow: {
    width: 240,
    height: 240,
    borderRadius: 999,
    opacity: 0.9,
    position: 'absolute',
    right: -40,
    top: -30,
  },
  heroContent: {
    gap: 12,
  },
  card: {
    gap: 8,
    borderRadius: 20,
    padding: 20,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
});