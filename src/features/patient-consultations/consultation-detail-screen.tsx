import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
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
import {
  getConsultationPriorityChip,
  getConsultationStatusChip,
  translateConsultationPriority,
  translateConsultationRole,
  translateConsultationSpecialty,
  translateConsultationStatus,
  translateSystemMessage,
} from '@/src/lib/consultation-labels';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';
import { AppButton } from '@/src/ui/button';

const PALETTE = {
  bg: ['#F0F9FA', '#E0F2F1'] as const,
  card: '#FFFFFF',
  cardBorder: 'rgba(20, 184, 166, 0.18)',
  primary: '#0891B2',
  teal: '#14B8A6',
  title: '#0F172A',
  subtitle: '#475569',
  surface: '#F8FCFD',
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
        {translateConsultationRole(message.senderRole)} · {formatDate(message.createdAt)}
      </ThemedText>
    </View>
  );
}

function getSpecialtyIcon(
  specialty: string | undefined | null,
): React.ComponentProps<typeof MaterialIcons>['name'] {
  if (specialty === 'URGENT_CARE') return 'emergency';
  if (specialty === 'ODONTOLOGY') return 'medical-services';
  return 'local-hospital';
}

function getStatusIcon(
  status: string | undefined | null,
): React.ComponentProps<typeof MaterialIcons>['name'] {
  if (status === 'IN_ATTENTION') return 'forum';
  if (status === 'CLOSED') return 'task-alt';
  return 'hourglass-top';
}

function DetailInfoItem({
  icon,
  label,
  value,
}: Readonly<{
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string;
}>) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoIcon}>
        <MaterialIcons color={PALETTE.teal} name={icon} size={18} />
      </View>
      <View style={styles.infoText}>
        <ThemedText style={styles.infoLabel}>{label}</ThemedText>
        <ThemedText style={styles.infoValue}>{value}</ThemedText>
      </View>
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
  const priorityChip = getConsultationPriorityChip(detail.priority);
  const statusChip = getConsultationStatusChip(detail.status);
  const specialtyLabel = translateConsultationSpecialty(detail.specialty);
  let messagesContent: ReactNode;

  if (messagesQuery.isLoading) {
    messagesContent = <ScreenLoadingState message="Cargando mensajes..." />;
  } else if (messages.length === 0) {
    messagesContent = (
      <ScreenEmptyState
        icon="chat-bubble-outline"
        title="Sin mensajes disponibles"
        description="Aún no hay mensajes para esta consulta."
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
      <LinearGradient colors={PALETTE.bg} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>Consulta</ThemedText>
          <ThemedText style={styles.subtitle}>Detalle clínico y trazabilidad de la atención</ThemedText>
        </ThemedView>

        <ThemedView lightColor={PALETTE.card} style={styles.heroCard}>
          <View style={styles.heroTop}>
            <LinearGradient
              colors={[PALETTE.teal, PALETTE.primary]}
              style={styles.heroIcon}
            >
              <MaterialIcons color="#FFFFFF" name={getSpecialtyIcon(detail.specialty)} size={28} />
            </LinearGradient>
            <View style={styles.heroText}>
              <ThemedText style={styles.heroEyebrow}>Especialidad</ThemedText>
              <ThemedText style={styles.heroTitle}>{specialtyLabel}</ThemedText>
            </View>
          </View>

          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: statusChip.bg }]}>
              <MaterialIcons color={statusChip.text} name={getStatusIcon(detail.status)} size={14} />
              <ThemedText style={[styles.chipText, { color: statusChip.text }]}>
                {statusChip.label}
              </ThemedText>
            </View>
            <View style={[styles.chip, { backgroundColor: priorityChip.bg }]}>
              <MaterialIcons color={priorityChip.text} name="priority-high" size={14} />
              <ThemedText style={[styles.chipText, { color: priorityChip.text }]}>
                Prioridad {priorityChip.label}
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        <ThemedView lightColor={PALETTE.card} style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBadge}>
              <MaterialIcons color={PALETTE.teal} name="fact-check" size={18} />
            </View>
            <ThemedText style={styles.sectionTitle}>Información de la consulta</ThemedText>
          </View>
          <View style={styles.infoGrid}>
            <DetailInfoItem icon="medical-services" label="Especialidad" value={specialtyLabel} />
            <DetailInfoItem
              icon="priority-high"
              label="Prioridad"
              value={translateConsultationPriority(detail.priority)}
            />
            <DetailInfoItem
              icon={getStatusIcon(detail.status)}
              label="Estado"
              value={translateConsultationStatus(detail.status)}
            />
            <DetailInfoItem icon="update" label="Actualizada" value={formatDate(detail.updatedAt)} />
            {detail.closedAt ? (
              <DetailInfoItem icon="event-available" label="Cierre" value={formatDate(detail.closedAt)} />
            ) : null}
          </View>
        </ThemedView>

        <ThemedView lightColor={PALETTE.card} style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBadge}>
              <MaterialIcons color={PALETTE.teal} name="summarize" size={18} />
            </View>
            <ThemedText style={styles.sectionTitle}>Resumen clínico</ThemedText>
          </View>
          {detail.clinicalSummary ? (
            <ThemedText style={styles.summaryText}>
              {translateSystemMessage(detail.clinicalSummary)}
            </ThemedText>
          ) : (
            <ThemedText style={styles.emptySummaryText}>
              El resumen estará disponible cuando el médico lo genere.
            </ThemedText>
          )}
        </ThemedView>

        <ThemedView lightColor={PALETTE.card} style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBadge}>
              <MaterialIcons color={PALETTE.teal} name="chat-bubble-outline" size={18} />
            </View>
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
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.bg[0],
  },
  gradient: {
    flex: 1,
  },
  container: {
    gap: 14,
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    backgroundColor: 'transparent',
    gap: 6,
    paddingHorizontal: 2,
  },
  title: {
    color: PALETTE.title,
    fontSize: 31,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 37,
  },
  subtitle: {
    color: PALETTE.subtitle,
    fontSize: 15,
    lineHeight: 21,
  },
  heroCard: {
    backgroundColor: PALETTE.card,
    borderColor: PALETTE.cardBorder,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 16,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  heroIcon: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  heroEyebrow: {
    color: PALETTE.subtitle,
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    color: PALETTE.title,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    backgroundColor: PALETTE.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: PALETTE.cardBorder,
    gap: 12,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 1,
  },
  infoGrid: {
    gap: 10,
  },
  infoItem: {
    alignItems: 'center',
    backgroundColor: PALETTE.surface,
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
    color: PALETTE.subtitle,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  infoValue: {
    color: PALETTE.title,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  summaryText: {
    color: PALETTE.title,
    fontSize: 14,
    lineHeight: 22,
  },
  emptySummaryText: {
    color: PALETTE.subtitle,
    fontSize: 14,
    lineHeight: 21,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
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
    color: PALETTE.title,
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.1,
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
