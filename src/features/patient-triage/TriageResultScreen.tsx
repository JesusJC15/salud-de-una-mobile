import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius } from '@/src/constants/theme';
import { useTriageResultQuery } from '@/src/features/triage/use-triage-flow';
import { getHumanReadableApiError } from '@/src/lib/get-human-readable-api-error';
import { TriagePriorityBadge } from '@/src/features/patient-triage/components/triage-priority-badge';
import { AppButton } from '@/src/ui/button';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

type TriageResultScreenProps = Readonly<{
  sessionId: string;
}>;

const PRIORITY_COPY = {
  HIGH: 'Se detectaron senales de alerta. Recomendamos atencion presencial inmediata.',
  LOW: 'No se detectaron senales graves. Puedes continuar con seguimiento general.',
  MODERATE: 'Se detectaron hallazgos que requieren evaluacion medica prioritaria.',
} as const;

export function TriageResultScreen({ sessionId }: TriageResultScreenProps) {
  const router = useRouter();
  const resultQuery = useTriageResultQuery(sessionId, Boolean(sessionId));

  const callEmergency = () => {
    void Linking.openURL('tel:911').catch(() => null);
  };

  const result = resultQuery.data;
  const errorMessage = resultQuery.error ? getHumanReadableApiError(resultQuery.error) : null;

  if (!sessionId) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ThemedView style={styles.centeredPage}>
          <ThemedText type="subtitle">No se pudo abrir este resultado.</ThemedText>
          <AppButton label="Volver" onPress={() => router.back()} variant="secondary" />
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (resultQuery.isPending && !result) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ThemedView style={styles.centeredPage}>
          <ThemedText type="subtitle">Analizando resultado de triage...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (errorMessage && !result) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ThemedView style={styles.centeredPage}>
          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          <AppButton
            label="Reintentar"
            loading={resultQuery.isFetching}
            onPress={() => void resultQuery.refetch()}
            variant="secondary"
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (!result) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ThemedView style={styles.centeredPage}>
          <ThemedText type="subtitle">Todavia no hay un resultado disponible para esta sesion.</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const isHighPriority = result.priority === 'HIGH';
  const isRuleBasedAnalysis = result.analysisMode === 'RULE_BASED';

  const analysisNotice = (() => {
    if (result.noticeCode === 'IA_NOT_IMPLEMENTED_RULE_BASED_FALLBACK') {
      return 'Modo de analisis actual: reglas clinicas (IA no disponible en este entorno).';
    }

    if (result.noticeCode === 'IA_TEMPORARILY_UNAVAILABLE_RULE_BASED_FALLBACK') {
      return 'IA temporalmente no disponible. Se aplico analisis por reglas clinicas.';
    }

    return 'Tu analisis fue realizado con reglas clinicas. Puede variar cuando la IA este disponible.';
  })();

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
            <ThemedText type="defaultSemiBold">Resultado del Triage</ThemedText>
            <View style={styles.backButton} />
          </View>

          <ThemedView darkColor="#0D3E43" lightColor="#FFFFFF" style={styles.priorityCard}>
            <TriagePriorityBadge priority={result.priority} />
            <View style={styles.priorityIconWrap}>
              <MaterialIcons color={isHighPriority ? '#DC2626' : '#14B8A6'} name="warning" size={28} />
            </View>
            <ThemedText style={styles.priorityCopy} type="defaultSemiBold">
              {PRIORITY_COPY[result.priority]}
            </ThemedText>
          </ThemedView>

          {isRuleBasedAnalysis ? (
            <ThemedView darkColor="#0B3B41" lightColor="#ECFEFF" style={styles.analysisNoticeCard}>
              <View style={styles.analysisNoticeHeader}>
                <MaterialIcons color="#0891B2" name="info-outline" size={16} />
                <ThemedText darkColor="#A5F3FC" lightColor="#0C4A6E" style={styles.analysisNoticeTitle} type="defaultSemiBold">
                  Analisis con reglas clinicas
                </ThemedText>
              </View>
              <ThemedText darkColor="#CFFAFE" lightColor="#155E75" style={styles.analysisNoticeText}>
                {analysisNotice}
              </ThemedText>
            </ThemedView>
          ) : null}

          {isHighPriority ? (
            <ThemedView darkColor="#4A0F17" lightColor="#FEF2F2" style={styles.warningBanner}>
              <ThemedText style={styles.warningText}>
                Un profesional medico revisara tus sintomas en breve. Si empeoran, acude al centro de
                urgencias mas cercano inmediatamente.
              </ThemedText>
            </ThemedView>
          ) : null}

          <View style={styles.flagsSection}>
            <ThemedText style={styles.flagsTitle} type="subtitle">
              Sintomas detectados
            </ThemedText>

            {result.redFlags.length === 0 ? (
              <ThemedView darkColor="#0D3E43" lightColor="#FFFFFF" style={styles.flagCard}>
                <ThemedText type="defaultSemiBold">Sin senales de alerta</ThemedText>
                <ThemedText type="muted">
                  No se registraron banderas rojas en esta evaluacion. Mantente atento a nuevos sintomas.
                </ThemedText>
              </ThemedView>
            ) : (
              result.redFlags.map((redFlag, index) => (
                <ThemedView key={redFlag.id ?? `${redFlag.title}-${index}`} darkColor="#0D3E43" lightColor="#FFFFFF" style={styles.flagCard}>
                  <View style={styles.flagTitleRow}>
                    <View style={styles.flagIconWrap}>
                      <MaterialIcons color="#14B8A6" name="report-problem" size={16} />
                    </View>
                    <View style={styles.flagTextWrap}>
                      <ThemedText type="defaultSemiBold">{redFlag.title}</ThemedText>
                      {redFlag.description ? <ThemedText type="muted">{redFlag.description}</ThemedText> : null}
                    </View>
                  </View>
                </ThemedView>
              ))
            )}
          </View>
        </ScrollView>

        <View style={styles.footerActions}>
          {isHighPriority ? (
            <Pressable accessibilityRole="button" onPress={callEmergency} style={styles.emergencyButton}>
              <MaterialIcons color="#FFFFFF" name="phone" size={18} />
              <ThemedText style={styles.emergencyButtonLabel} type="defaultSemiBold">
                Llamar a emergencias
              </ThemedText>
            </Pressable>
          ) : null}

          <AppButton
            label="Ver mi consulta"
            onPress={() => router.replace('/(tabs)/notifications')}
            variant="primary"
          />
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  analysisNoticeCard: {
    borderColor: '#BAE6FD',
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  analysisNoticeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  analysisNoticeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  analysisNoticeTitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  backButton: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  centeredPage: {
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    gap: 16,
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  emergencyButton: {
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: Radius.lg,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  emergencyButtonLabel: {
    color: '#FFFFFF',
  },
  errorText: {
    color: '#DC2626',
  },
  flagCard: {
    borderColor: '#D7EAF0',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 12,
  },
  flagIconWrap: {
    alignItems: 'center',
    backgroundColor: '#E7FBF9',
    borderRadius: Radius.pill,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  flagTextWrap: {
    flex: 1,
    gap: 1,
  },
  flagTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  flagsSection: {
    gap: 10,
  },
  flagsTitle: {
    fontSize: 26,
    lineHeight: 30,
  },
  footerActions: {
    borderTopColor: '#DBE9EC',
    borderTopWidth: 1,
    gap: 10,
    paddingBottom: 14,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  page: {
    flex: 1,
  },
  priorityCard: {
    borderColor: '#D7EAF0',
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  priorityCopy: {
    textAlign: 'center',
  },
  priorityIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
  },
  warningBanner: {
    borderColor: '#FECACA',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  warningText: {
    color: '#B91C1C',
  },
});
