import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius } from '@/src/constants/theme';
import { useCreateTriageSessionMutation } from '@/src/features/triage/use-triage-flow';
import { getHumanReadableApiError } from '@/src/lib/get-human-readable-api-error';
import { TriageProgress } from '@/src/features/patient-triage/components/triage-progress';
import { TriageSpecialtyOptionCard } from '@/src/features/patient-triage/components/triage-specialty-option-card';
import { TriageSpecialty } from '@/src/types/triage';
import { AppButton } from '@/src/ui/button';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

export function TriageSelectionScreen() {
  const router = useRouter();
  const createSessionMutation = useCreateTriageSessionMutation();
  const [selectedSpecialty, setSelectedSpecialty] = React.useState<TriageSpecialty>('GENERAL_MEDICINE');

  const errorMessage = createSessionMutation.error
    ? getHumanReadableApiError(createSessionMutation.error)
    : null;

  const startTriage = async () => {
    try {
      const session = await createSessionMutation.mutateAsync({ specialty: selectedSpecialty });

      router.push(`./session/${session.id}`);
    } catch {
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
              selected={selectedSpecialty === 'DENTISTRY'}
              specialty="DENTISTRY"
              subtitle="Dolor dental, molestias de encia y urgencias odontologicas."
              title="Odontologia"
              onPress={setSelectedSpecialty}
            />
          </View>

          {errorMessage ? (
            <ThemedView darkColor="#4A0F17" lightColor="#FEF2F2" style={styles.errorCard}>
              <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            </ThemedView>
          ) : null}

          <AppButton
            disabled={createSessionMutation.isPending}
            label="Iniciar triaje"
            loading={createSessionMutation.isPending}
            onPress={() => void startTriage()}
          />
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  title: {
    fontSize: 35,
    lineHeight: 40,
  },
  titleBlock: {
    gap: 12,
  },
});
