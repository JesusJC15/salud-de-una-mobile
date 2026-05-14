import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { Colors, Radius } from '@/src/constants/theme';
import { isAllowedDeepLink } from '@/src/lib/deep-link';
import { usePatientNotifications } from '@/src/features/patient-notifications/use-patient-notifications';
import type { NotificationListItem } from '@/src/types/notification';
import { AppButton } from '@/src/ui/button';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  FOLLOWUP_REMINDER: 'Seguimiento pendiente',
  CONSULTATION_UPDATE: 'Actualización de consulta',
  NEW_MESSAGE: 'Nuevo mensaje',
  TRIAGE_COMPLETE: 'Triage completado',
  SYSTEM: 'Aviso del sistema',
  DOCTOR_STATUS_CHANGE: 'Estado de doctor',
};

const NOTIFICATION_TYPE_ICONS: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
  FOLLOWUP_REMINDER: 'assignment-late',
  CONSULTATION_UPDATE: 'chat',
  NEW_MESSAGE: 'chat',
  TRIAGE_COMPLETE: 'check-circle',
  SYSTEM: 'info',
  DOCTOR_STATUS_CHANGE: 'person',
};

function getNotificationLabel(type: string): string {
  return NOTIFICATION_TYPE_LABELS[type] ?? type.replace(/_/g, ' ');
}

function getNotificationIcon(type: string): React.ComponentProps<typeof MaterialIcons>['name'] {
  return NOTIFICATION_TYPE_ICONS[type] ?? 'notifications';
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Sin fecha';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NotificationCard({
  item,
  onMarkAsRead,
  pending,
  onOpen,
}: {
  item: NotificationListItem;
  onMarkAsRead: (notificationId: string) => void;
  pending: boolean;
  onOpen: (item: NotificationListItem) => void;
}) {
  const icon = getNotificationIcon(item.type);
  const label = getNotificationLabel(item.type);

  return (
    <Pressable onPress={() => onOpen(item)}>
      <ThemedView lightColor="#FCFFFF" style={[styles.card, !item.read && styles.cardUnread]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrapper, { backgroundColor: item.read ? Colors.light.surface : '#EFF6FF' }]}>
            <MaterialIcons
              name={icon}
              size={18}
              color={item.read ? Colors.light.textMuted : Colors.light.tint}
            />
          </View>
          <View style={styles.headerText}>
            <ThemedText style={[styles.typeLabel, { color: Colors.light.text }]}>
              {label}
            </ThemedText>
            <ThemedText style={styles.dateText}>{formatDate(item.createdAt)}</ThemedText>
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </View>

        <ThemedText style={styles.messageText}>{item.message}</ThemedText>

        {!item.read && (
          <Pressable
            disabled={pending}
            onPress={() => onMarkAsRead(item.id)}
            style={styles.inlineAction}
          >
            <ThemedText type="link">Marcar como leída</ThemedText>
          </Pressable>
        )}
      </ThemedView>
    </Pressable>
  );
}

export function PatientNotificationsScreen() {
  const router = useRouter();
  const { markAllAsReadMutation, markAsReadMutation, notificationsQuery } = usePatientNotifications();
  const items = notificationsQuery.data?.items ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  function handleOpen(notification: NotificationListItem) {
    const deepLink = notification.deepLink;
    if (deepLink && isAllowedDeepLink(deepLink)) {
      router.push(deepLink as never);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="eyebrow">Paciente</ThemedText>
        <ThemedText type="title">Notificaciones</ThemedText>
      </ThemedView>

      <ThemedView lightColor="#FCFFFF" style={styles.summaryCard}>
        <ThemedText type="subtitle">
          Sin leer: <ThemedText type="defaultSemiBold">{unreadCount}</ThemedText>
        </ThemedText>
        <AppButton
          disabled={unreadCount === 0}
          label="Marcar todas como leídas"
          loading={markAllAsReadMutation.isPending}
          onPress={() => void markAllAsReadMutation.mutateAsync()}
          variant="secondary"
        />
      </ThemedView>

      {notificationsQuery.error instanceof Error && (
        <ThemedView lightColor="#FCFFFF" style={styles.summaryCard}>
          <ThemedText style={styles.errorMessage}>{notificationsQuery.error.message}</ThemedText>
          <AppButton
            label="Reintentar"
            loading={notificationsQuery.isFetching}
            onPress={() => void notificationsQuery.refetch()}
            variant="secondary"
          />
        </ThemedView>
      )}

      <FlatList
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={() => void notificationsQuery.refetch()}
        refreshing={notificationsQuery.isRefetching}
        renderItem={({ item }) => (
          <NotificationCard
            item={item}
            onMarkAsRead={(notificationId) => void markAsReadMutation.mutateAsync(notificationId)}
            pending={markAsReadMutation.isPending}
            onOpen={handleOpen}
          />
        )}
        ListEmptyComponent={
          notificationsQuery.isPending ? (
            <ThemedView lightColor="#FCFFFF" style={styles.emptyCard}>
              <ThemedText type="muted">Cargando notificaciones...</ThemedText>
            </ThemedView>
          ) : (
            <ThemedView lightColor="#FCFFFF" style={styles.emptyCard}>
              <MaterialIcons name="notifications-none" size={40} color={Colors.light.border} />
              <ThemedText type="subtitle">Todo al día</ThemedText>
              <ThemedText type="muted">No tenés notificaciones pendientes.</ThemedText>
            </ThemedView>
          )
        }
      />
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
    gap: 4,
  },
  summaryCard: {
    borderRadius: Radius.xl,
    gap: 10,
    padding: 16,
  },
  listContent: {
    gap: 10,
    paddingBottom: 32,
  },
  card: {
    borderRadius: Radius.xl,
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardUnread: {
    borderColor: Colors.light.tint,
    backgroundColor: '#F0FFFE',
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  iconWrapper: {
    alignItems: 'center',
    borderRadius: Radius.md,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateText: {
    color: Colors.light.textMuted,
    fontSize: 11,
  },
  unreadDot: {
    backgroundColor: Colors.light.tint,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  messageText: {
    color: Colors.light.text,
    fontSize: 14,
    lineHeight: 20,
  },
  inlineAction: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
    borderRadius: Radius.xl,
    gap: 10,
    marginTop: 12,
    padding: 32,
  },
  errorMessage: {
    color: Colors.light.destructive,
  },
});
