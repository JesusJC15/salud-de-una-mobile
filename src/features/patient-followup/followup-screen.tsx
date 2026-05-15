import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ScreenEmptyState,
  ScreenErrorState,
  ScreenLoadingState,
} from '@/src/components/screen-states';
import { Colors, Radius } from '@/src/constants/theme';
import { ApiError } from '@/src/services/api/api-error';
import { useToast } from '@/src/providers/toast-provider';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

import { useFollowup, useSubmitFollowup } from './use-patient-followups';

const CHANGE_OPTIONS = [
  { value: 'BETTER', label: 'Mejor' },
  { value: 'SAME', label: 'Igual' },
  { value: 'WORSE', label: 'Peor' },
] as const;

export function FollowupScreen({ followupId }: { followupId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const followupQuery = useFollowup(followupId);
  const submitMutation = useSubmitFollowup();
  const [currentSymptomSeverity, setCurrentSymptomSeverity] = useState(5);
  const [change, setChange] = useState<'BETTER' | 'SAME' | 'WORSE'>('SAME');
  const [medicationTaken, setMedicationTaken] = useState(false);
  const [medicationNotes, setMedicationNotes] = useState('');
  const [newSymptoms, setNewSymptoms] = useState('');

  const followup = followupQuery.data;

  async function handleSubmit() {
    try {
      await submitMutation.mutateAsync({
        followupId,
        currentSymptomSeverity,
        change,
        medicationTaken,
        medicationNotes: medicationNotes.trim() || undefined,
        newSymptoms: newSymptoms.trim() || undefined,
      });
      showToast({ message: 'Seguimiento enviado correctamente.', type: 'success' });
      router.replace('/(tabs)/history');
    } catch (error) {
      const message = ApiError.fromUnknown(error).message || 'No se pudo enviar el seguimiento.';
      showToast({ message, type: 'error' });
    }
  }

  if (followupQuery.isLoading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <ScreenLoadingState message="Cargando seguimiento..." />
      </SafeAreaView>
    );
  }

  if (followupQuery.isError) {
    const message =
      followupQuery.error instanceof Error
        ? followupQuery.error.message
        : 'No se pudo cargar este seguimiento.';

    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <ScreenErrorState
          message={message}
          onRetry={() => void followupQuery.refetch()}
          onExit={() => router.replace('/(tabs)/history')}
        />
      </SafeAreaView>
    );
  }

  if (!followup) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <ScreenEmptyState
          icon="assignment-late"
          title="Seguimiento no disponible"
          description="No encontramos este seguimiento o ya no esta activo."
          actionLabel="Volver al historial"
          onAction={() => router.replace('/(tabs)/history')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <ThemedText type="title">Seguimiento post-consulta</ThemedText>
        <ThemedText type="muted">
          Programado para {new Date(followup.scheduledAt).toLocaleString('es-CO')}
        </ThemedText>

        <ThemedView lightColor="#FCFFFF" style={styles.card}>
          <ThemedText type="subtitle">Como te sientes hoy?</ThemedText>
          <ThemedText type="muted">Severidad base: {followup.baselineSymptomSeverity}/10</ThemedText>
          <Slider
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={currentSymptomSeverity}
            minimumTrackTintColor={Colors.light.tint}
            maximumTrackTintColor={Colors.light.border}
            onValueChange={setCurrentSymptomSeverity}
          />
          <ThemedText type="defaultSemiBold">{currentSymptomSeverity}/10</ThemedText>
        </ThemedView>

        <ThemedView lightColor="#FCFFFF" style={styles.card}>
          <ThemedText type="subtitle">Cambio percibido</ThemedText>
          <View style={styles.row}>
            {CHANGE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setChange(option.value)}
                style={[styles.chip, change === option.value && styles.chipActive]}
              >
                <ThemedText style={change === option.value ? styles.chipTextActive : styles.chipText}>
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </ThemedView>

        <ThemedView lightColor="#FCFFFF" style={styles.card}>
          <View style={styles.switchRow}>
            <ThemedText type="subtitle">Tomaste medicacion?</ThemedText>
            <Switch value={medicationTaken} onValueChange={setMedicationTaken} />
          </View>
          <TextInput
            value={medicationNotes}
            onChangeText={setMedicationNotes}
            placeholder="Notas de medicacion"
            placeholderTextColor={Colors.light.textMuted}
            style={styles.input}
          />
          <TextInput
            value={newSymptoms}
            onChangeText={setNewSymptoms}
            placeholder="Nuevos sintomas"
            placeholderTextColor={Colors.light.textMuted}
            multiline
            style={[styles.input, styles.textArea]}
          />
        </ThemedView>

        <Pressable
          onPress={() => void handleSubmit()}
          disabled={submitMutation.isPending}
          style={[styles.submitButton, submitMutation.isPending && styles.submitButtonDisabled]}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <ThemedText style={styles.submitText}>Enviar seguimiento</ThemedText>
          )}
        </Pressable>

        {submitMutation.isError && (
          <ThemedText style={styles.errorText}>
            {ApiError.fromUnknown(submitMutation.error).message ||
              'No se pudo enviar el seguimiento. Intenta de nuevo.'}
          </ThemedText>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { gap: 16, padding: 20, paddingBottom: 32 },
  card: { borderRadius: Radius.xl, gap: 12, padding: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  chipText: { color: Colors.light.textMuted, fontWeight: '700' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  switchRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  input: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    color: Colors.light.text,
    fontSize: 14,
    padding: 12,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  submitButton: {
    alignItems: 'center',
    backgroundColor: Colors.light.tint,
    borderRadius: Radius.xl,
    padding: 14,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  errorText: {
    color: Colors.light.destructive,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
