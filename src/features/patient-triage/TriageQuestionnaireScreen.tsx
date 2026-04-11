import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius } from '@/src/constants/theme';
import {
  useAnalyzeTriageSessionMutation,
  useSubmitTriageAnswerMutation,
  useTriageSessionQuery,
} from '@/src/features/triage/use-triage-flow';
import { getHumanReadableApiError } from '@/src/lib/get-human-readable-api-error';
import { TriageProgress } from '@/src/features/patient-triage/components/triage-progress';
import { TriageQuestionInput } from '@/src/features/patient-triage/components/triage-question-input';
import { TriageAnswerSubmissionInput } from '@/src/types/triage';
import { AppButton } from '@/src/ui/button';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

type TriageQuestionnaireScreenProps = Readonly<{
  sessionId: string;
}>;

export function TriageQuestionnaireScreen({ sessionId }: TriageQuestionnaireScreenProps) {
  const router = useRouter();
  const sessionQuery = useTriageSessionQuery(sessionId, Boolean(sessionId));
  const submitMutation = useSubmitTriageAnswerMutation(sessionId);
  const analyzeMutation = useAnalyzeTriageSessionMutation(sessionId);

  const [singleSelection, setSingleSelection] = useState<string | null>(null);
  const [multiSelection, setMultiSelection] = useState<string[]>([]);
  const [numericValue, setNumericValue] = useState<number | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const triageSession = sessionQuery.data;
  const currentQuestion = triageSession?.currentQuestion;

  useEffect(() => {
    setSingleSelection(null);
    setMultiSelection([]);
    setNumericValue(null);
    setValidationMessage(null);
  }, [currentQuestion?.id]);

  const uiError = useMemo(() => {
    if (validationMessage) {
      return validationMessage;
    }

    if (submitMutation.error) {
      return getHumanReadableApiError(submitMutation.error);
    }

    if (analyzeMutation.error) {
      return getHumanReadableApiError(analyzeMutation.error);
    }

    if (sessionQuery.error) {
      return getHumanReadableApiError(sessionQuery.error);
    }

    return null;
  }, [analyzeMutation.error, sessionQuery.error, submitMutation.error, validationMessage]);

  const hasMissingSessionEndpointError = useMemo(() => {
    if (!sessionQuery.error) {
      return false;
    }

    const errorText = getHumanReadableApiError(sessionQuery.error);

    return errorText.includes('Cannot GET') && errorText.includes('/v1/triage/sessions/');
  }, [sessionQuery.error]);

  const buildSubmissionPayload = (): TriageAnswerSubmissionInput | null => {
    if (!currentQuestion) {
      setValidationMessage('No hay una pregunta activa para responder.');
      return null;
    }

    if (currentQuestion.type === 'SINGLE_CHOICE') {
      if (!singleSelection) {
        setValidationMessage('Selecciona una opcion para continuar.');
        return null;
      }

      return {
        questionId: currentQuestion.id,
        selectedOptionId: singleSelection,
        type: 'SINGLE_CHOICE',
      };
    }

    if (currentQuestion.type === 'MULTI_CHOICE') {
      if (multiSelection.length === 0) {
        setValidationMessage('Selecciona al menos una opcion para continuar.');
        return null;
      }

      return {
        questionId: currentQuestion.id,
        selectedOptionIds: multiSelection,
        type: 'MULTI_CHOICE',
      };
    }

    if (numericValue == null) {
      setValidationMessage('Selecciona un valor de intensidad para continuar.');
      return null;
    }

    if (numericValue < currentQuestion.minValue || numericValue > currentQuestion.maxValue) {
      setValidationMessage('El valor numerico esta fuera del rango permitido.');
      return null;
    }

    return {
      questionId: currentQuestion.id,
      type: 'NUMERIC_SCALE',
      value: numericValue,
    };
  };

  const submitCurrentQuestion = async () => {
    const payload = buildSubmissionPayload();

    if (!payload) {
      return;
    }

    setValidationMessage(null);

    try {
      await submitMutation.mutateAsync(payload);
      await sessionQuery.refetch();
    } catch {
      // La mutacion expone el error para renderizarlo.
    }
  };

  const finishAndAnalyze = async () => {
    try {
      await analyzeMutation.mutateAsync();
      router.replace(`/(patient)/triage/session/${sessionId}/result`);
    } catch {
      // La mutacion expone el error para renderizarlo.
    }
  };

  if (!sessionId) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ThemedView style={styles.centeredPage}>
          <ThemedText type="subtitle">No se pudo abrir esta sesion de triage.</ThemedText>
          <AppButton label="Volver" onPress={() => router.back()} variant="secondary" />
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (sessionQuery.isPending && !triageSession) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ThemedView style={styles.centeredPage}>
          <ThemedText type="subtitle">Cargando cuestionario de triage...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (sessionQuery.error && !triageSession) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ThemedView style={styles.centeredPage}>
          <ThemedText style={styles.errorText}>
            {hasMissingSessionEndpointError
              ? 'No fue posible abrir el cuestionario porque el backend no expone el detalle de la sesion de triage.'
              : getHumanReadableApiError(sessionQuery.error)}
          </ThemedText>

          {hasMissingSessionEndpointError ? (
            <ThemedText type="muted">
              Solicita al backend el endpoint GET /v1/triage/sessions/:sessionId con preguntas completas
              (tipo y opciones) para continuar el flujo desde movil.
            </ThemedText>
          ) : null}

          <AppButton label="Volver a triage" onPress={() => router.replace('/(patient)/triage')} variant="secondary" />
          <AppButton
            label="Reintentar"
            loading={sessionQuery.isFetching}
            onPress={() => void sessionQuery.refetch()}
            variant="primary"
          />
        </ThemedView>
      </SafeAreaView>
    );
  }

  const isComplete = triageSession?.isComplete ?? false;
  const totalSteps = triageSession?.totalSteps ?? 1;
  const step = isComplete ? totalSteps : triageSession?.currentStep ?? 1;

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
              <MaterialIcons color="#14B8A6" name="arrow-back" size={22} />
            </Pressable>
            <ThemedText type="defaultSemiBold">Cuestionario de Triage</ThemedText>
            <View style={styles.backButton} />
          </View>

          <TriageProgress label="Progreso del triage" step={step} total={totalSteps} />

          {currentQuestion ? (
            <View style={styles.questionBlock}>
              <ThemedText style={styles.questionTitle} type="title">
                {currentQuestion.title}
              </ThemedText>
              {currentQuestion.description ? <ThemedText type="muted">{currentQuestion.description}</ThemedText> : null}

              <TriageQuestionInput
                multiSelection={multiSelection}
                numericValue={numericValue}
                question={currentQuestion}
                singleSelection={singleSelection}
                onScaleSelect={setNumericValue}
                onSingleSelect={(optionId) => {
                  setValidationMessage(null);
                  setSingleSelection(optionId);
                }}
                onToggleMulti={(optionId) => {
                  setValidationMessage(null);
                  setMultiSelection((previous) =>
                    previous.includes(optionId)
                      ? previous.filter((value) => value !== optionId)
                      : [...previous, optionId]
                  );
                }}
              />
            </View>
          ) : (
            <ThemedView darkColor="#0D3E43" lightColor="#FFFFFF" style={styles.waitingCard}>
              <ThemedText type="subtitle">No hay preguntas pendientes.</ThemedText>
              <ThemedText type="muted">
                Si ya completaste el formulario, puedes finalizar para analizar el resultado.
              </ThemedText>
            </ThemedView>
          )}

          {uiError ? (
            <ThemedView darkColor="#4A0F17" lightColor="#FEF2F2" style={styles.errorCard}>
              <ThemedText style={styles.errorText}>{uiError}</ThemedText>
            </ThemedView>
          ) : null}
        </ScrollView>

        <View style={styles.footerActions}>
          <AppButton label="Atras" onPress={() => router.back()} variant="secondary" />
          {isComplete ? (
            <AppButton
              disabled={analyzeMutation.isPending}
              label="Finalizar y analizar"
              loading={analyzeMutation.isPending}
              onPress={() => void finishAndAnalyze()}
            />
          ) : (
            <AppButton
              disabled={submitMutation.isPending || !currentQuestion}
              label="Siguiente"
              loading={submitMutation.isPending}
              onPress={() => void submitCurrentQuestion()}
            />
          )}
        </View>
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
  centeredPage: {
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    gap: 18,
    paddingBottom: 18,
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
  footerActions: {
    borderTopColor: '#DBE9EC',
    borderTopWidth: 1,
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  page: {
    flex: 1,
  },
  questionBlock: {
    gap: 14,
  },
  questionTitle: {
    fontSize: 38,
    lineHeight: 42,
  },
  safeArea: {
    flex: 1,
  },
  waitingCard: {
    borderColor: '#D7EAF0',
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
});
