import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius } from '@/src/constants/theme';
import { TriageActiveSessionCard } from '@/src/features/patient-triage/components/triage-active-session-card';
import { getHumanReadableApiError } from '@/src/lib/get-human-readable-api-error';
import { TriageProgress } from '@/src/features/patient-triage/components/triage-progress';
import { TriageSpecialtyOptionCard } from '@/src/features/patient-triage/components/triage-specialty-option-card';
import {
  useActiveTriageSessionsQuery,
  useCancelTriageSessionMutation,
  useCreateTriageSessionMutation,
} from '@/src/features/triage/use-triage-flow';
import { getExistingTriageSessionIdFromError } from '@/src/services/triage/triage-api';
import { TriageSpecialty } from '@/src/types/triage';
import { AppButton } from '@/src/ui/button';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

export function TriageSelectionScreen() {
  const router = useRouter();
  const createSessionMutation = useCreateTriageSessionMutation();
  const activeSessionsQuery = useActiveTriageSessionsQuery();
  const cancelSessionMutation = useCancelTriageSessionMutation();
  const [selectedSpecialty, setSelectedSpecialty] = React.useState<TriageSpecialty>('GENERAL_MEDICINE');
  const [feedbackMessage, setFeedbackMessage] = React.useState<string | null>(null);

  const activeSessions = activeSessionsQuery.data?.items ?? [];
  const activeSessionForSelected = activeSessions.find(
    (session) => session.specialty === selectedSpecialty && session.status === 'IN_PROGRESS'
  );

  const errorMessage = React.useMemo(() => {
    if (createSessionMutation.error) {
      return getHumanReadableApiError(createSessionMutation.error);
    }

    if (cancelSessionMutation.error) {
      return getHumanReadableApiError(cancelSessionMutation.error);
    }

    if (activeSessionsQuery.error) {
      return getHumanReadableApiError(activeSessionsQuery.error);
    }

    return null;
  }, [activeSessionsQuery.error, cancelSessionMutation.error, createSessionMutation.error]);

  let activeSessionsContent = (
    <View style={styles.activeSessionsList}>
      {activeSessions.map((session) => (
        <TriageActiveSessionCard
          key={session.id}
          isCanceling={cancelSessionMutation.isPending && cancelSessionMutation.variables === session.id}
          session={session}
          onCancel={(targetSession) => cancelActiveSession(targetSession.id)}
          onResume={(targetSession) => openSession(targetSession.id)}
        />
      ))}
    </View>
  );

  if (activeSessionsQuery.isPending) {
    activeSessionsContent = <ThemedText type="muted">Cargando sesiones activas...</ThemedText>;
  } else if (activeSessions.length === 0) {
    activeSessionsContent = (
      <ThemedText type="muted">
        Aun no tienes procesos activos. Cuando inicies uno, podras retomarlo desde aqui.
      </ThemedText>
    );
  }

  const openSession = (sessionId: string) => {
    router.push(`/(patient)/triage/session/${sessionId}`);
  };

  const executeCancelSession = async (sessionId: string) => {
    setFeedbackMessage(null);

    try {
      await cancelSessionMutation.mutateAsync(sessionId);
      await activeSessionsQuery.refetch();
      setFeedbackMessage('Sesion cancelada. Ya puedes iniciar un nuevo triaje.');
    } catch {
      // El estado de error ya queda en la mutacion.
    }
  };

  const cancelActiveSession = (sessionId: string) => {
    const title = 'Cancelar triage en curso';
    const message = 'Esta accion cerrara la sesion activa y tendras que iniciar una nueva evaluacion.';

    if (Platform.OS === 'web') {
      const shouldCancel = typeof globalThis.confirm === 'function' ? globalThis.confirm(message) : true;

      if (!shouldCancel) {
        return;
      }

      void executeCancelSession(sessionId);
      return;
    }

    Alert.alert(
      title,
      message,
      [
        { text: 'Mantener', style: 'cancel' },
        {
          text: 'Cancelar sesion',
          style: 'destructive',
          onPress: () => void executeCancelSession(sessionId),
        },
      ]
    );
  };

  const startTriage = async () => {
    setFeedbackMessage(null);

    if (activeSessionForSelected) {
      openSession(activeSessionForSelected.id);
      return;
    }

    try {
      const session = await createSessionMutation.mutateAsync({ specialty: selectedSpecialty });

      openSession(session.id);
    } catch (error) {
      const existingSessionId = getExistingTriageSessionIdFromError(error);

      if (existingSessionId) {
        setFeedbackMessage('Encontramos un triaje en progreso para esta especialidad. Lo reanudaremos.');
        openSession(existingSessionId);
      }

      // El estado de error ya se refleja en la mutacion.
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ThemedView style={styles.page}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Pressable
              accessibilityLabel="Volver"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => router.back()}
              style={styles.backButton}>
              <MaterialIcons color="#0F172A" name="arrow-back" size={22} />
            </Pressable>
            <ThemedText type="defaultSemiBold">SaludDeUna</ThemedText>
            <View style={styles.backButton} />
          </View>

          <TriageProgress label="Progreso del triage" step={1} total={4} />

          <View style={styles.titleBlock}>
            <ThemedText style={styles.title} type="title">
              Seleccion de Especialidad
            </ThemedText>
            <ThemedView darkColor="#0F4F55" lightColor="#E7F7F8" style={styles.introCard}>
              <ThemedText type="muted">
                Bienvenido a tu triaje digital. Selecciona el area de salud que requiere evaluacion para
                comenzar.
              </ThemedText>
            </ThemedView>
          </View>

          <View accessibilityLabel="Especialidades" accessibilityRole="radiogroup" style={styles.optionsColumn}>
            <TriageSpecialtyOptionCard
              selected={selectedSpecialty === 'GENERAL_MEDICINE'}
              specialty="GENERAL_MEDICINE"
              subtitle="Consultas generales, gripe y sintomas comunes."
              title="Medicina General"
              onPress={setSelectedSpecialty}
            />
            <TriageSpecialtyOptionCard
              selected={selectedSpecialty === 'ODONTOLOGY'}
              specialty="ODONTOLOGY"
              subtitle="Dolor dental, molestias de encia y urgencias odontologicas."
              title="Odontologia"
              onPress={setSelectedSpecialty}
            />
          </View>

          <ThemedView darkColor="#0D3E43" lightColor="#F7FCFC" style={styles.activeSessionsSection}>
            <View style={styles.activeSessionsHeader}>
              <ThemedText type="defaultSemiBold">Tus triajes en progreso</ThemedText>
              {activeSessions.length > 0 ? (
                <ThemedText type="muted">{activeSessions.length} activos</ThemedText>
              ) : null}
            </View>

            {activeSessionsContent}
          </ThemedView>

          {feedbackMessage ? (
            <ThemedView darkColor="#0D4A48" lightColor="#ECFDF5" style={styles.successCard}>
              <ThemedText style={styles.successText}>{feedbackMessage}</ThemedText>
            </ThemedView>
          ) : null}

          {errorMessage ? (
            <ThemedView darkColor="#4A0F17" lightColor="#FEF2F2" style={styles.errorCard}>
              <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            </ThemedView>
          ) : null}

          <AppButton
            disabled={createSessionMutation.isPending}
            label={activeSessionForSelected ? 'Reanudar triaje' : 'Iniciar triaje'}
            loading={createSessionMutation.isPending}
            onPress={() => void startTriage()}
          />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activeSessionsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activeSessionsList: {
    gap: 10,
  },
  activeSessionsSection: {
    borderColor: '#CFEAEB',
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  backButton: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  content: {
    gap: 18,
    paddingBottom: 32,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  errorCard: {
    borderColor: '#FECACA',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: '#DC2626',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  introCard: {
    borderColor: '#BCE4E8',
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionsColumn: {
    gap: 10,
  },
  page: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  successCard: {
    borderColor: '#A7F3D0',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  successText: {
    color: '#047857',
  },
  title: {
    fontSize: 35,
    lineHeight: 40,
  },
  titleBlock: {
    gap: 12,
  },
});
