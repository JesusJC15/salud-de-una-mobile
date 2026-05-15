import { MaterialIcons } from '@expo/vector-icons';
import { type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius } from '@/src/constants/theme';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

type LoadingStateProps = {
  message?: string;
};

type ErrorStateProps = {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  exitLabel?: string;
  onExit?: () => void;
};

type EmptyStateProps = {
  icon?: ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ScreenLoadingState({ message = 'Cargando...' }: LoadingStateProps) {
  return (
    <ThemedView style={styles.centeredState}>
      <ActivityIndicator color={Colors.light.tint} size="large" />
      <ThemedText style={styles.stateMessage} type="muted">
        {message}
      </ThemedText>
    </ThemedView>
  );
}

export function ScreenErrorState({
  title = 'No pudimos cargar esta pantalla',
  message,
  retryLabel = 'Reintentar',
  onRetry,
  exitLabel = 'Volver',
  onExit,
}: ErrorStateProps) {
  return (
    <ThemedView style={styles.centeredState}>
      <MaterialIcons color={Colors.light.destructive} name="error-outline" size={40} />
      <ThemedText style={styles.errorTitle} type="defaultSemiBold">
        {title}
      </ThemedText>
      <ThemedText style={styles.stateMessage} type="muted">
        {message}
      </ThemedText>
      <View style={styles.actionsRow}>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={({ pressed }) => [styles.actionButton, styles.retryButton, { opacity: pressed ? 0.85 : 1 }]}
          >
            <ThemedText style={styles.retryText}>{retryLabel}</ThemedText>
          </Pressable>
        ) : null}
        {onExit ? (
          <Pressable
            accessibilityRole="button"
            onPress={onExit}
            style={({ pressed }) => [styles.actionButton, styles.exitButton, { opacity: pressed ? 0.85 : 1 }]}
          >
            <ThemedText style={styles.exitText}>{exitLabel}</ThemedText>
          </Pressable>
        ) : null}
      </View>
    </ThemedView>
  );
}

export function ScreenEmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <ThemedView style={styles.centeredState}>
      <MaterialIcons color={Colors.light.border} name={icon} size={44} />
      <ThemedText style={styles.errorTitle} type="defaultSemiBold">
        {title}
      </ThemedText>
      {description ? (
        <ThemedText style={styles.stateMessage} type="muted">
          {description}
        </ThemedText>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [styles.actionButton, styles.retryButton, { opacity: pressed ? 0.85 : 1 }]}
        >
          <ThemedText style={styles.retryText}>{actionLabel}</ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centeredState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 10,
  },
  stateMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorTitle: {
    color: Colors.light.text,
    fontSize: 16,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    borderRadius: Radius.md,
    minHeight: 44,
    minWidth: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
  },
  exitButton: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderWidth: 1,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  exitText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
