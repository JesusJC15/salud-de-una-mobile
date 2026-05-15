import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Radius } from '@/src/constants/theme';
import {
  consultationHistoryService,
  type ConsultationMessage,
} from '@/src/features/patient-consultations/consultation-history-service';
import {
  ScreenEmptyState,
  ScreenErrorState,
  ScreenLoadingState,
} from '@/src/components/screen-states';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';
import { AppButton } from '@/src/ui/button';

const SPECIALTY_LABELS: Record<string, string> = {
  GENERAL_MEDICINE: 'Medicina General',
  ODONTOLOGY: 'Odontologia',
  URGENT_CARE: 'Urgencias',
};

const PRIORITY_LABELS: Record<string, string> = {
  HIGH: 'Alta',
  MODERATE: 'Moderada',
  LOW: 'Baja',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_ATTENTION: 'En atencion',
  CLOSED: 'Cerrada',
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) {
    return 'Sin fecha';
  }

  return new Date(dateStr).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MessageRow({
  message,
  isMine,
}: Readonly<{ message: ConsultationMessage; isMine: boolean }>) {
  return (
    <View style={[styles.messageRow, isMine ? styles.messageMine : styles.messageOther]}>
      <ThemedText style={[styles.messageText, { color: isMine ? '#FFFFFF' : Colors.light.text }]}>
        {message.content}
      </ThemedText>
      <ThemedText style={[styles.messageMeta, { color: isMine ? '#D1FAF5' : Colors.light.textMuted }]}>
        {message.senderRole === 'PATIENT' ? 'Tu' : 'Medico'} · {formatDate(message.createdAt)}
      </ThemedText>
    </View>
  );
}

export function ConsultationDetailScreen({
  consultationId,
}: Readonly<{ consultationId: string }>) {
  const router = useRouter();

  const detailQuery = useQuery({
    queryKey: ['patient', 'consultation', consultationId],
    queryFn: () => consultationHistoryService.getById(consultationId),
    enabled: consultationId.length > 0,
    staleTime: 30_000,
  });

  const messagesQuery = useQuery({
    queryKey: ['patient', 'consultation', consultationId, 'messages'],
    queryFn: () => consultationHistoryService.getMessages(consultationId, 50),
    enabled: consultationId.length > 0,
    staleTime: 15_000,
  });

  if (detailQuery.isLoading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScreenLoadingState message="Cargando detalle de consulta..." />
      </SafeAreaView>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    const message =
      detailQuery.error instanceof Error
        ? detailQuery.error.message
        : 'No fue posible cargar esta consulta.';

    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScreenErrorState
          message={message}
          onRetry={() => void detailQuery.refetch()}
          onExit={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const detail = detailQuery.data;
  const canOpenChat = detail.status !== 'PENDING';
  const isClosed = detail.status === 'CLOSED';
  const messages = messagesQuery.data?.items ?? [];
  let messagesContent: ReactNode;

  if (messagesQuery.isLoading) {
    messagesContent = <ScreenLoadingState message="Cargando mensajes..." />;
  } else if (messages.length === 0) {
    messagesContent = (
      <ScreenEmptyState
        icon="chat-bubble-outline"
        title="Sin mensajes disponibles"
        description="Aun no hay mensajes para esta consulta."
      />
    );
  } else {
    messagesContent = (
      <View style={styles.messagesList}>
        {messages.slice(-10).map((message) => (
          <MessageRow
            key={message.id}
            isMine={message.senderRole === 'PATIENT'}
            message={message}
          />
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="eyebrow">Consulta</ThemedText>
          <ThemedText type="title">Detalle</ThemedText>
          <ThemedText type="muted">Revision clinica y trazabilidad de la atencion</ThemedText>
        </ThemedView>

        <ThemedView lightColor="#FCFFFF" style={styles.card}>
          <View style={styles.cardRow}>
            <ThemedText style={styles.label}>Especialidad</ThemedText>
            <ThemedText style={styles.value}>
              {SPECIALTY_LABELS[detail.specialty] ?? detail.specialty}
            </ThemedText>
          </View>
          <View style={styles.cardRow}>
            <ThemedText style={styles.label}>Prioridad</ThemedText>
            <ThemedText style={styles.value}>
              {PRIORITY_LABELS[detail.priority] ?? detail.priority}
            </ThemedText>
          </View>
          <View style={styles.cardRow}>
            <ThemedText style={styles.label}>Estado</ThemedText>
            <ThemedText style={styles.value}>{STATUS_LABELS[detail.status] ?? detail.status}</ThemedText>
          </View>
          <View style={styles.cardRow}>
            <ThemedText style={styles.label}>Actualizada</ThemedText>
            <ThemedText style={styles.value}>{formatDate(detail.updatedAt)}</ThemedText>
          </View>
          {detail.closedAt ? (
            <View style={styles.cardRow}>
              <ThemedText style={styles.label}>Cierre</ThemedText>
              <ThemedText style={styles.value}>{formatDate(detail.closedAt)}</ThemedText>
            </View>
          ) : null}
          {detail.clinicalSummary ? (
            <View style={styles.summaryBlock}>
              <ThemedText style={styles.label}>Resumen clinico</ThemedText>
              <ThemedText style={styles.summaryText}>{detail.clinicalSummary}</ThemedText>
            </View>
          ) : null}
        </ThemedView>

        <ThemedView lightColor="#FCFFFF" style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialIcons color={Colors.light.tint} name="chat-bubble-outline" size={18} />
            <ThemedText style={styles.sectionTitle}>Mensajes recientes</ThemedText>
          </View>
          {messagesContent}
        </ThemedView>

        <View style={styles.actions}>
          {canOpenChat ? (
            <AppButton
              label={isClosed ? 'Ver chat cerrado' : 'Abrir chat'}
              onPress={() =>
                router.push(`/triage/chat/${consultationId}?closed=${isClosed ? '1' : '0'}`)
              }
            />
          ) : null}
          <AppButton
            label="Volver a consultas"
            onPress={() => router.push('/(tabs)/history')}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    gap: 14,
    padding: 20,
    paddingBottom: 30,
  },
  header: {
    gap: 4,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
    gap: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  label: {
    color: Colors.light.textMuted,
    fontSize: 13,
  },
  value: {
    color: Colors.light.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  summaryBlock: {
    borderTopColor: Colors.light.border,
    borderTopWidth: 1,
    gap: 6,
    paddingTop: 10,
  },
  summaryText: {
    color: Colors.light.text,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '800',
  },
  messagesList: {
    gap: 8,
  },
  messageRow: {
    borderRadius: Radius.lg,
    gap: 6,
    padding: 12,
    maxWidth: '90%',
  },
  messageMine: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.light.tint,
  },
  messageOther: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageMeta: {
    fontSize: 11,
  },
  actions: {
    gap: 10,
  },
});
