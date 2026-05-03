import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { TriageQuestion } from '@/src/schemas/triage';
import { useTriageStore } from '@/src/store/triage-store';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';
import type { AnswerValue } from './triage-service';
import { useTriageSession } from './use-triage-session';

const PALETTE = {
  bg: ['#F0F9FA', '#E0F2F1'] as const,
  primary: '#0891B2',
  teal: '#14B8A6',
  card: '#FFFFFF',
  cardBorder: 'rgba(20, 184, 166, 0.18)',
  title: '#0F172A',
  subtitle: '#475569',
  selected: '#0891B2',
  unselected: '#E2E8F0',
  error: '#DC2626',
};

type Props = { sessionId: string };

function ProgressBar({ percent }: { percent: number }) {
  return (
    <View style={styles.progressOuter}>
      <View style={[styles.progressInner, { width: `${percent}%`, backgroundColor: PALETTE.teal }]} />
    </View>
  );
}

function SingleChoiceField({
  question,
  value,
  onChange,
}: {
  question: TriageQuestion;
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.optionsContainer}>
      {question.options?.map((opt) => {
        const selected = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={[
              styles.option,
              { borderColor: selected ? PALETTE.selected : PALETTE.unselected, backgroundColor: selected ? 'rgba(8,145,178,0.08)' : PALETTE.card },
            ]}
          >
            <View style={[styles.radio, { borderColor: selected ? PALETTE.selected : '#94A3B8' }]}>
              {selected && <View style={styles.radioFill} />}
            </View>
            <ThemedText style={[styles.optionText, { color: PALETTE.title }]}>
              {opt.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function MultiChoiceField({
  question,
  value,
  onChange,
}: {
  question: TriageQuestion;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <View style={styles.optionsContainer}>
      {question.options?.map((opt) => {
        const selected = value.includes(opt.id);
        return (
          <Pressable
            key={opt.id}
            onPress={() => toggle(opt.id)}
            style={[
              styles.option,
              { borderColor: selected ? PALETTE.selected : PALETTE.unselected, backgroundColor: selected ? 'rgba(8,145,178,0.08)' : PALETTE.card },
            ]}
          >
            <View style={[styles.checkbox, { borderColor: selected ? PALETTE.selected : '#94A3B8', backgroundColor: selected ? PALETTE.selected : PALETTE.card }]}>
              {selected && <MaterialIcons name="check" size={13} color="#FFFFFF" />}
            </View>
            <ThemedText style={[styles.optionText, { color: PALETTE.title }]}>
              {opt.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function NumericScaleField({
  question,
  value,
  onChange,
}: {
  question: TriageQuestion;
  value: number;
  onChange: (v: number) => void;
}) {
  const min = question.minValue ?? 0;
  const max = question.maxValue ?? 10;
  const step = question.step ?? 1;

  return (
    <View style={styles.sliderContainer}>
      <ThemedText style={[styles.sliderValue, { color: PALETTE.primary }]}>
        {value}
      </ThemedText>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={PALETTE.teal}
        maximumTrackTintColor={PALETTE.unselected}
        thumbTintColor={PALETTE.primary}
        style={styles.slider}
      />
      <View style={styles.sliderLabels}>
        <ThemedText style={[styles.sliderLabel, { color: PALETTE.subtitle }]}>{min}</ThemedText>
        <ThemedText style={[styles.sliderLabel, { color: PALETTE.subtitle }]}>{max}</ThemedText>
      </View>
    </View>
  );
}

export function TriageQuestionScreen({ sessionId }: Props) {
  const router = useRouter();
  const setConsultationId = useTriageStore((s) => s.setConsultationId);
  const clearTriage = useTriageStore((s) => s.clearTriage);
  const { sessionQuery, saveAnswersMutation, analyzeMutation, cancelMutation } =
    useTriageSession(sessionId);

  const [singleValue, setSingleValue] = useState<string | null>(null);
  const [multiValue, setMultiValue] = useState<string[]>([]);
  const [numericValue, setNumericValue] = useState<number>(5);
  const [validationError, setValidationError] = useState<string | null>(null);

  const session = sessionQuery.data;
  const nextQuestion = session?.questions.find(
    (q) => q.id === session.nextQuestionId,
  );
  const isLoading =
    saveAnswersMutation.isPending ||
    analyzeMutation.isPending ||
    sessionQuery.isLoading;

  const getAnswerValue = (q: TriageQuestion): AnswerValue | null => {
    if (q.type === 'SINGLE_CHOICE') return singleValue;
    if (q.type === 'MULTI_CHOICE') return multiValue.length > 0 ? multiValue : null;
    if (q.type === 'NUMERIC_SCALE') return numericValue;
    return null;
  };

  const resetAnswerState = () => {
    setSingleValue(null);
    setMultiValue([]);
    setNumericValue(5);
    setValidationError(null);
  };

  const handleNext = async () => {
    if (!nextQuestion) return;

    const answerValue = getAnswerValue(nextQuestion);
    if (answerValue === null) {
      setValidationError('Selecciona una respuesta para continuar');
      return;
    }

    setValidationError(null);
    const result = await saveAnswersMutation.mutateAsync([
      { questionId: nextQuestion.questionId, answerValue },
    ]);
    resetAnswerState();

    if (result.isComplete) {
      const analysis = await analyzeMutation.mutateAsync();
      setConsultationId(analysis.consultationId);
      router.replace(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `/triage/result?sessionId=${sessionId}&priority=${analysis.priority}&consultationId=${analysis.consultationId}` as any,
      );
    }
  };

  const handleCancel = async () => {
    await cancelMutation.mutateAsync();
    clearTriage();
    router.replace('/(tabs)');
  };

  if (sessionQuery.isLoading) {
    return (
      <LinearGradient colors={PALETTE.bg} style={styles.centered}>
        <ActivityIndicator size="large" color={PALETTE.primary} />
      </LinearGradient>
    );
  }

  if (!session || !nextQuestion) {
    return (
      <LinearGradient colors={PALETTE.bg} style={styles.centered}>
        <ThemedText style={{ color: PALETTE.subtitle }}>
          No hay preguntas disponibles
        </ThemedText>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={PALETTE.bg} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <ThemedView style={styles.progressBlock}>
          <ThemedText style={[styles.progressLabel, { color: PALETTE.subtitle }]}>
            {session.answeredCount} de {session.totalQuestions} preguntas
          </ThemedText>
          <ProgressBar percent={session.progressPercent} />
        </ThemedView>

        <ThemedView style={[styles.card, { backgroundColor: PALETTE.card, borderColor: PALETTE.cardBorder }]}>
          <ThemedText style={[styles.questionTitle, { color: PALETTE.title }]}>
            {nextQuestion.questionText}
          </ThemedText>
          {nextQuestion.description ? (
            <ThemedText style={[styles.questionDesc, { color: PALETTE.subtitle }]}>
              {nextQuestion.description}
            </ThemedText>
          ) : null}

          {nextQuestion.type === 'SINGLE_CHOICE' && (
            <SingleChoiceField
              question={nextQuestion}
              value={singleValue}
              onChange={setSingleValue}
            />
          )}
          {nextQuestion.type === 'MULTI_CHOICE' && (
            <MultiChoiceField
              question={nextQuestion}
              value={multiValue}
              onChange={setMultiValue}
            />
          )}
          {nextQuestion.type === 'NUMERIC_SCALE' && (
            <NumericScaleField
              question={nextQuestion}
              value={numericValue}
              onChange={setNumericValue}
            />
          )}

          {validationError ? (
            <ThemedText style={[styles.errorText, { color: PALETTE.error }]}>
              {validationError}
            </ThemedText>
          ) : null}

          {saveAnswersMutation.isError || analyzeMutation.isError ? (
            <ThemedText style={[styles.errorText, { color: PALETTE.error }]}>
              Ocurrió un error. Intenta de nuevo.
            </ThemedText>
          ) : null}
        </ThemedView>

        <View style={styles.actions}>
          <Pressable
            onPress={() => void handleCancel()}
            disabled={isLoading}
            style={[styles.cancelBtn, { borderColor: PALETTE.cardBorder }]}
          >
            <ThemedText style={[styles.cancelText, { color: PALETTE.subtitle }]}>
              Cancelar
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => void handleNext()}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.nextBtn,
              {
                backgroundColor: isLoading ? '#94A3B8' : PALETTE.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.nextText}>
                {session.answeredCount + 1 >= session.totalQuestions
                  ? 'Finalizar'
                  : 'Continuar'}
              </ThemedText>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  progressBlock: { backgroundColor: 'transparent', marginBottom: 18 },
  progressLabel: { fontSize: 13, marginBottom: 8 },
  progressOuter: { backgroundColor: '#E2E8F0', borderRadius: 6, height: 6, overflow: 'hidden' },
  progressInner: { borderRadius: 6, height: 6 },
  card: {
    borderRadius: 20, borderWidth: 1, gap: 14, marginBottom: 20,
    padding: 18, shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  questionTitle: { fontSize: 19, fontWeight: '800', lineHeight: 26 },
  questionDesc: { fontSize: 14, lineHeight: 20 },
  optionsContainer: { gap: 10 },
  option: {
    alignItems: 'center', borderRadius: 12, borderWidth: 1.5,
    flexDirection: 'row', gap: 12, padding: 14,
  },
  radio: {
    alignItems: 'center', borderRadius: 10, borderWidth: 2,
    height: 20, justifyContent: 'center', width: 20,
  },
  radioFill: { backgroundColor: '#0891B2', borderRadius: 5, height: 10, width: 10 },
  checkbox: {
    alignItems: 'center', borderRadius: 5, borderWidth: 2,
    height: 20, justifyContent: 'center', width: 20,
  },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600' },
  sliderContainer: { alignItems: 'center', gap: 4 },
  sliderValue: { fontSize: 36, fontWeight: '900' },
  slider: { width: '100%' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  sliderLabel: { fontSize: 12 },
  errorText: { fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    alignItems: 'center', borderRadius: 14, borderWidth: 1,
    flex: 1, justifyContent: 'center', minHeight: 52,
  },
  cancelText: { fontSize: 15, fontWeight: '700' },
  nextBtn: {
    alignItems: 'center', borderRadius: 14, flex: 2,
    justifyContent: 'center', minHeight: 52,
  },
  nextText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
