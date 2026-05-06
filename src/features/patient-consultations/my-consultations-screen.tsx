import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radius } from '@/src/constants/theme';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';
import { useConsultationHistory, useRateConsultation } from './use-consultation-history';
import type { ConsultationHistoryItem } from './consultation-history-service';

const SPECIALTY_LABELS: Record<string, string> = {
  GENERAL_MEDICINE: 'Medicina General',
  ODONTOLOGY: 'Odontología',
};

const PRIORITY_CONFIG = {
  HIGH: { label: 'Alta', bg: '#FEE2E2', text: '#B91C1C' },
  MODERATE: { label: 'Moderada', bg: '#FEF9C3', text: '#92400E' },
  LOW: { label: 'Baja', bg: '#D1FAE5', text: '#065F46' },
} as const;

const STATUS_CONFIG = {
  PENDING: { label: 'Pendiente', bg: '#F1F5F9', text: '#475569' },
  IN_ATTENTION: { label: 'En atención', bg: '#DBEAFE', text: '#1E40AF' },
  CLOSED: { label: 'Atendida', bg: '#CCFBF1', text: '#0F766E' },
} as const;

const STATUS_FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_ATTENTION', label: 'En atención' },
  { value: 'CLOSED', label: 'Atendidas' },
];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = 24,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => !readonly && onChange?.(star)}
          disabled={readonly}
          hitSlop={4}
        >
          <MaterialIcons
            name={star <= value ? 'star' : 'star-border'}
            size={size}
            color={star <= value ? '#F59E0B' : Colors.light.border}
          />
        </Pressable>
      ))}
    </View>
  );
}

function RatingModal({
  item,
  onClose,
}: {
  item: ConsultationHistoryItem;
  onClose: () => void;
}) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const { mutate, isPending, isError } = useRateConsultation();

  function submit() {
    if (stars === 0) return;
    mutate(
      { consultationId: item.id, rating: stars, ratingComment: comment.trim() || undefined },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => undefined}>
          <ThemedText style={styles.modalTitle}>Califica tu consulta</ThemedText>
          <ThemedText style={styles.modalSubtitle}>
            {SPECIALTY_LABELS[item.specialty] ?? item.specialty} · {formatDate(item.closedAt)}
          </ThemedText>

          <StarRating value={stars} onChange={setStars} size={36} />

          <TextInput
            style={styles.commentInput}
            placeholder="Comentario opcional..."
            placeholderTextColor={Colors.light.textMuted}
            multiline
            maxLength={500}
            value={comment}
            onChangeText={setComment}
          />

          {isError && (
            <ThemedText style={styles.errorText}>
              No se pudo enviar. Intenta de nuevo.
            </ThemedText>
          )}

          <View style={styles.modalActions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.submitButton, (stars === 0 || isPending) && styles.submitButtonDisabled]}
              onPress={submit}
              disabled={stars === 0 || isPending}
            >
              {isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <ThemedText style={styles.submitButtonText}>Enviar</ThemedText>
              }
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ConsultationCard({
  item,
  onRate,
}: {
  item: ConsultationHistoryItem;
  onRate: (item: ConsultationHistoryItem) => void;
}) {
  const router = useRouter();
  const priority = PRIORITY_CONFIG[item.priority];
  const status = STATUS_CONFIG[item.status];
  const canRate = item.status === 'CLOSED' && item.rating == null;

  return (
    <Pressable
      onPress={() => {
        if (item.status !== 'PENDING') {
          const closed = item.status === 'CLOSED' ? '1' : '0';
          router.push(`/triage/chat/${item.id}?closed=${closed}` as never);
        }
      }}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
    >
      <View style={styles.cardHeader}>
        <ThemedText style={styles.specialty}>
          {SPECIALTY_LABELS[item.specialty] ?? item.specialty}
        </ThemedText>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: priority.bg }]}>
            <ThemedText style={[styles.badgeText, { color: priority.text }]}>
              {priority.label}
            </ThemedText>
          </View>
          <View style={[styles.badge, { backgroundColor: status.bg }]}>
            <ThemedText style={[styles.badgeText, { color: status.text }]}>
              {status.label}
            </ThemedText>
          </View>
        </View>
      </View>

      <ThemedText style={styles.date}>
        {formatDate(item.createdAt)}
        {item.closedAt ? ` — cerrada ${formatDate(item.closedAt)}` : ''}
      </ThemedText>

      {item.clinicalSummary ? (
        <ThemedText style={styles.summary} numberOfLines={2}>
          {item.clinicalSummary}
        </ThemedText>
      ) : null}

      {item.rating != null && (
        <StarRating value={item.rating} readonly size={16} />
      )}

      <View style={styles.cardFooter}>
        {item.status !== 'PENDING' && (
          <>
            <ThemedText style={styles.viewChat}>Ver chat</ThemedText>
            <MaterialIcons name="chevron-right" size={16} color={Colors.light.tint} />
          </>
        )}
        {canRate && (
          <Pressable
            onPress={(e) => { e.stopPropagation(); onRate(item); }}
            style={styles.rateButton}
          >
            <MaterialIcons name="star-outline" size={14} color={Colors.light.tint} />
            <ThemedText style={styles.rateButtonText}>Calificar</ThemedText>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

export function MyConsultationsScreen() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingTarget, setRatingTarget] = useState<ConsultationHistoryItem | null>(null);
  const { data, isLoading, isError, refetch } = useConsultationHistory(page, statusFilter || undefined);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Mis consultas</ThemedText>
      </View>

      <View style={styles.filters}>
        {STATUS_FILTERS.map(f => (
          <Pressable
            key={f.value}
            onPress={() => { setStatusFilter(f.value); setPage(1); }}
            style={[
              styles.filterChip,
              statusFilter === f.value && styles.filterChipActive,
            ]}
          >
            <ThemedText style={[
              styles.filterChipText,
              statusFilter === f.value && styles.filterChipTextActive,
            ]}>
              {f.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.light.tint} size="large" />
        </View>
      )}

      {isError && (
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={40} color={Colors.light.destructive} />
          <ThemedText style={styles.errorText}>No se pudo cargar el historial</ThemedText>
          <Pressable onPress={() => void refetch()} style={styles.retryButton}>
            <ThemedText style={styles.retryText}>Reintentar</ThemedText>
          </Pressable>
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ConsultationCard item={item} onRate={setRatingTarget} />
          )}
          ListEmptyComponent={(
            <View style={styles.centered}>
              <MaterialIcons name="folder-open" size={48} color={Colors.light.border} />
              <ThemedText style={styles.emptyText}>No hay consultas aún</ThemedText>
            </View>
          )}
          ListFooterComponent={totalPages > 1 ? (
            <View style={styles.pagination}>
              <Pressable
                disabled={page <= 1}
                onPress={() => setPage(p => p - 1)}
                style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
              >
                <MaterialIcons name="chevron-left" size={20} color={page <= 1 ? Colors.light.border : Colors.light.tint} />
              </Pressable>
              <ThemedText style={styles.pageText}>{page} / {totalPages}</ThemedText>
              <Pressable
                disabled={page >= totalPages}
                onPress={() => setPage(p => p + 1)}
                style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
              >
                <MaterialIcons name="chevron-right" size={20} color={page >= totalPages ? Colors.light.border : Colors.light.tint} />
              </Pressable>
            </View>
          ) : null}
        />
      )}

      {ratingTarget && (
        <RatingModal item={ratingTarget} onClose={() => setRatingTarget(null)} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.light.text, letterSpacing: -0.4 },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 12, flexWrap: 'wrap' },
  filterChip: {
    borderRadius: Radius.pill, borderWidth: 1,
    borderColor: Colors.light.border, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: Colors.light.surface,
  },
  filterChipActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  filterChipText: { fontSize: 12, fontWeight: '600', color: Colors.light.textMuted },
  filterChipTextActive: { color: '#FFFFFF' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: Colors.light.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.light.border,
    padding: 16, gap: 8,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  specialty: { fontSize: 15, fontWeight: '700', color: Colors.light.text, flex: 1 },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  date: { fontSize: 12, color: Colors.light.textMuted },
  summary: { fontSize: 13, color: Colors.light.textMuted, lineHeight: 18 },
  stars: { flexDirection: 'row', gap: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  viewChat: { fontSize: 13, fontWeight: '700', color: Colors.light.tint },
  rateButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  rateButtonText: { fontSize: 13, fontWeight: '700', color: Colors.light.tint },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
  errorText: { fontSize: 14, color: Colors.light.destructive, textAlign: 'center' },
  retryButton: { marginTop: 4 },
  retryText: { fontSize: 14, fontWeight: '700', color: Colors.light.tint },
  emptyText: { fontSize: 14, color: Colors.light.textMuted },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16 },
  pageButton: { padding: 6, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.light.border, backgroundColor: Colors.light.surface },
  pageButtonDisabled: { opacity: 0.4 },
  pageText: { fontSize: 13, color: Colors.light.textMuted, fontWeight: '600' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.light.surface, borderRadius: Radius.xl,
    padding: 24, width: '100%', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.light.text },
  modalSubtitle: { fontSize: 13, color: Colors.light.textMuted, marginTop: -8 },
  commentInput: {
    borderWidth: 1, borderColor: Colors.light.border,
    borderRadius: Radius.lg, padding: 12,
    fontSize: 14, color: Colors.light.text,
    minHeight: 80, textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelButton: {
    flex: 1, padding: 12, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.light.border,
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 14, fontWeight: '700', color: Colors.light.textMuted },
  submitButton: {
    flex: 1, padding: 12, borderRadius: Radius.lg,
    backgroundColor: Colors.light.tint, alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
