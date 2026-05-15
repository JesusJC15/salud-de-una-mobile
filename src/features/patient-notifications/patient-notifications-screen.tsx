import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { Colors, Radius } from '@/src/constants/theme';
import {
  ScreenEmptyState,
  ScreenErrorState,
  ScreenLoadingState,
} from '@/src/components/screen-states';
import {
  translateNotificationType,
  translateSystemMessage,
} from '@/src/lib/consultation-labels';
import { isAllowedDeepLink } from '@/src/lib/deep-link';
import { useToast } from '@/src/providers/toast-provider';
import { usePatientNotifications } from '@/src/features/patient-notifications/use-patient-notifications';
import type { NotificationListItem } from '@/src/types/notification';
import { AppButton } from '@/src/ui/button';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

const NOTIFICATION_TYPE_ICONS: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
  FOLLOWUP_REMINDER: 'assignment-late',
  CONSULTATION_UPDATE: 'chat',
  CONSULTATION_ASSIGNED: 'medical-services',
  CONSULTATION_CLOSED: 'task-alt',
  NEW_MESSAGE: 'chat',
  CHAT_MESSAGE: 'chat',
  TRIAGE_COMPLETE: 'check-circle',
  TRIAGE_COMPLETED: 'check-circle',
  SYSTEM: 'info',
  DOCTOR_STATUS_CHANGE: 'person',
  FOLLOWUP_PRIORITY_ESCALATED: 'priority-high',
};

const CONNECTION_STATUS_LABELS = {
  connected: 'En línea',
  connecting: 'Conectando',
  reconnecting: 'Reconectando',
  disconnected: 'Sin conexión',
} as const;

const CONNECTION_STATUS_COLORS = {
  connected: Colors.light.success,
  connecting: Colors.light.warning,
  reconnecting: Colors.light.warning,
  disconnected: Colors.light.textMuted,
} as const;

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
  const label = translateNotificationType(item.type);

  return (
    <Pressable accessibilityRole="button" onPress={() => onOpen(item)}>
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

        <ThemedText style={styles.messageText}>
          {translateSystemMessage(item.message, 'Mensaje no disponible')}
        </ThemedText>

        {!item.read && (
          <Pressable
            accessibilityRole="button"
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
  const { showToast } = useToast();
  const {
    connectionStatus,
    markAllAsReadMutation,
    markAsReadMutation,
    notificationsQuery,
  } = usePatientNotifications();
  const items = notificationsQuery.data?.items ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  async function handleMarkAllAsRead() {
    try {
      await markAllAsReadMutation.mutateAsync();
      showToast({
        message: 'Se marcaron todas las notificaciones como leídas.',
        type: 'success',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo actualizar el estado.';
      showToast({
        message,
        type: 'error',
      });
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo marcar la notificación como leída.';
      showToast({
        message,
        type: 'error',
      });
    }
  }

  function handleOpen(notification: NotificationListItem) {
    const deepLink = notification.deepLink;

    if (!deepLink) {
      showToast({
        message: 'Esta notificación no tiene acción disponible.',
        type: 'info',
      });
      return;
    }

    if (!isAllowedDeepLink(deepLink)) {
      showToast({
        message: 'Este enlace no está disponible en la app móvil.',
        type: 'warning',
      });
      return;
    }

    if (!notification.read) {
      void handleMarkAsRead(notification.id);
    }
    router.push(deepLink as never);
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="eyebrow">Paciente</ThemedText>
          <ThemedText type="title">Notificaciones</ThemedText>
          <View style={styles.connectionRow}>
            <View
              style={[
                styles.connectionDot,
                { backgroundColor: CONNECTION_STATUS_COLORS[connectionStatus] },
              ]}
            />
            <ThemedText type="muted">{CONNECTION_STATUS_LABELS[connectionStatus]}</ThemedText>
          </View>
        </ThemedView>

        <ThemedView lightColor="#FCFFFF" style={styles.summaryCard}>
          <ThemedText type="subtitle">
            Sin leer: <ThemedText type="defaultSemiBold">{unreadCount}</ThemedText>
          </ThemedText>
          <AppButton
            disabled={unreadCount === 0}
            label="Marcar todas como leídas"
            loading={markAllAsReadMutation.isPending}
            onPress={() => void handleMarkAllAsRead()}
            variant="secondary"
          />
        </ThemedView>

        {notificationsQuery.error instanceof Error ? (
          <ScreenErrorState
            message={notificationsQuery.error.message}
            onRetry={() => void notificationsQuery.refetch()}
            onExit={() => router.push('/(tabs)')}
          />
        ) : null}

        <FlatList
          contentContainerStyle={styles.listContent}
          data={items}
          keyExtractor={(item) => item.id}
          onRefresh={() => void notificationsQuery.refetch()}
          refreshing={notificationsQuery.isRefetching}
          renderItem={({ item }) => (
            <NotificationCard
              item={item}
              onMarkAsRead={(notificationId) => void handleMarkAsRead(notificationId)}
              pending={markAsReadMutation.isPending}
              onOpen={handleOpen}
            />
          )}
          ListEmptyComponent={
            notificationsQuery.isPending ? (
              <ScreenLoadingState message="Cargando notificaciones..." />
            ) : (
              <ScreenEmptyState
                icon="notifications-none"
                title="Todo al día"
                description="No tienes notificaciones pendientes."
              />
            )
          }
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.light.background,
    flex: 1,
  },
  container: {
    flex: 1,
    gap: 16,
    padding: 24,
  },
  header: {
    gap: 6,
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
  connectionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  connectionDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
});
