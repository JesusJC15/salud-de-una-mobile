import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Radius } from '@/src/constants/theme';
import { usePatientNotifications } from '@/src/features/patient-notifications/use-patient-notifications';
import { NotificationListItem } from '@/src/types/notification';
import { AppButton } from '@/src/ui/button';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

function NotificationCard({
  item,
  onMarkAsRead,
  pending,
}: {
  item: NotificationListItem;
  onMarkAsRead: (notificationId: string) => void;
  pending: boolean;
}) {
  return (
    <ThemedView lightColor="#FCFFFF" style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText type="defaultSemiBold">{item.type}</ThemedText>
        <ThemedText type={item.read ? 'muted' : 'eyebrow'}>{item.read ? 'Leida' : 'Nueva'}</ThemedText>
      </View>
      <ThemedText>{item.message}</ThemedText>
      <ThemedText type="muted">Estado backend: {item.status}</ThemedText>
      <ThemedText type="muted">Creada: {item.createdAt ?? 'Sin fecha'}</ThemedText>
      {!item.read ? (
        <Pressable disabled={pending} onPress={() => onMarkAsRead(item.id)} style={styles.inlineAction}>
          <ThemedText type="link">Marcar como leida</ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

export function PatientNotificationsScreen() {
  const { markAllAsReadMutation, markAsReadMutation, notificationsQuery } = usePatientNotifications();
  const items = notificationsQuery.data?.items ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="eyebrow">Paciente</ThemedText>
        <ThemedText type="title">Notificaciones</ThemedText>
        <ThemedText type="muted">
          Centro inicial de notificaciones conectado al contrato compartido con el frontend web.
        </ThemedText>
      </ThemedView>

      <ThemedView lightColor="#FCFFFF" style={styles.summaryCard}>
        <ThemedText type="subtitle">Resumen</ThemedText>
        <ThemedText>
          Sin leer: <ThemedText type="defaultSemiBold">{unreadCount}</ThemedText>
        </ThemedText>
        <AppButton
          disabled={unreadCount === 0}
          label="Marcar todas como leidas"
          loading={markAllAsReadMutation.isPending}
          onPress={() => void markAllAsReadMutation.mutateAsync()}
          variant="secondary"
        />
      </ThemedView>

      {notificationsQuery.error instanceof Error ? (
        <ThemedView lightColor="#FCFFFF" style={styles.summaryCard}>
          <ThemedText style={styles.errorMessage}>{notificationsQuery.error.message}</ThemedText>
          <AppButton
            label="Reintentar"
            loading={notificationsQuery.isFetching}
            onPress={() => void notificationsQuery.refetch()}
            variant="secondary"
          />
        </ThemedView>
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
            onMarkAsRead={(notificationId) => void markAsReadMutation.mutateAsync(notificationId)}
            pending={markAsReadMutation.isPending}
          />
        )}
        ListEmptyComponent={
          notificationsQuery.isPending ? (
            <ThemedView lightColor="#FCFFFF" style={styles.emptyCard}>
              <ThemedText type="muted">Cargando notificaciones...</ThemedText>
            </ThemedView>
          ) : (
            <ThemedView lightColor="#FCFFFF" style={styles.emptyCard}>
              <ThemedText type="subtitle">Todo al dia</ThemedText>
              <ThemedText type="muted">
                Cuando el backend publique eventos para el paciente, apareceran aqui.
              </ThemedText>
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
    gap: 8,
  },
  summaryCard: {
    borderRadius: Radius.xl,
    gap: 10,
    padding: 20,
  },
  listContent: {
    gap: 12,
    paddingBottom: 32,
  },
  card: {
    borderRadius: Radius.xl,
    gap: 8,
    padding: 16,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inlineAction: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  emptyCard: {
    alignItems: 'center',
    borderRadius: Radius.xl,
    gap: 8,
    marginTop: 12,
    padding: 24,
  },
  errorMessage: {
    color: '#DC2626',
  },
});
