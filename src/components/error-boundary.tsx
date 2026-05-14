import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius } from '@/src/constants/theme';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Algo salió mal</Text>
        <Text style={styles.body}>
          Ocurrió un error inesperado. Podés intentar recargar la pantalla.
        </Text>
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [styles.button, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.buttonText}>Reintentar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 16,
    padding: 24,
    width: '100%',
  },
  title: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
    borderRadius: Radius.lg,
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
