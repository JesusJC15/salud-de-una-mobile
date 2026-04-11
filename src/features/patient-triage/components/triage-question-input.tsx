import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius } from '@/src/constants/theme';
import { TriageQuestion } from '@/src/types/triage';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

type TriageQuestionInputProps = Readonly<{
  multiSelection: string[];
  numericValue: number | null;
  question: TriageQuestion;
  singleSelection: string | null;
  onScaleSelect: (value: number) => void;
  onSingleSelect: (optionId: string) => void;
  onToggleMulti: (optionId: string) => void;
}>;

function buildScaleValues(question: TriageQuestion) {
  const values: number[] = [];

  for (let value = question.minValue; value <= question.maxValue; value += question.step) {
    values.push(value);

    if (values.length > 20) {
      break;
    }
  }

  return values.length > 0 ? values : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
}

export function TriageQuestionInput({
  multiSelection,
  numericValue,
  question,
  singleSelection,
  onScaleSelect,
  onSingleSelect,
  onToggleMulti,
}: TriageQuestionInputProps) {
  if (question.type === 'NUMERIC_SCALE') {
    const values = buildScaleValues(question);

    return (
      <ThemedView darkColor="#0D3E43" lightColor="#FFFFFF" style={styles.scaleCard}>
        <ThemedText style={styles.scaleValue} type="title">
          {numericValue ?? '-'}
        </ThemedText>

        <View style={styles.scaleRow}>
          {values.map((value) => {
            const selected = value === numericValue;

            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onScaleSelect(value)}
                style={({ pressed }) => [
                  styles.scalePoint,
                  selected ? styles.scalePointSelected : undefined,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <ThemedText
                  darkColor={selected ? '#FFFFFF' : '#D8F4F6'}
                  lightColor={selected ? '#FFFFFF' : '#0F3A40'}
                  style={selected ? styles.scalePointLabelSelected : styles.scalePointLabel}>
                  {value}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ThemedView>
    );
  }

  return (
    <View style={styles.optionsColumn}>
      {question.options.map((option) => {
        const selected =
          question.type === 'SINGLE_CHOICE'
            ? singleSelection === option.id
            : multiSelection.includes(option.id);

        const role = question.type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox';

        return (
          <Pressable
            key={option.id}
            accessibilityRole={role}
            accessibilityState={{ checked: selected }}
            onPress={() => {
              if (question.type === 'SINGLE_CHOICE') {
                onSingleSelect(option.id);
                return;
              }

              onToggleMulti(option.id);
            }}
            style={({ pressed }) => [styles.optionPressable, { opacity: pressed ? 0.94 : 1 }]}
          >
            <ThemedView
              darkColor={selected ? '#0F4F55' : '#0D3E43'}
              lightColor={selected ? '#E8FCFA' : '#FFFFFF'}
              style={[styles.optionCard, selected ? styles.optionCardSelected : undefined]}>
              <View style={styles.optionContent}>
                <ThemedText type="defaultSemiBold">{option.label}</ThemedText>
                {option.description ? <ThemedText type="muted">{option.description}</ThemedText> : null}
              </View>

              {selected ? (
                <MaterialIcons color="#14B8A6" name="check-circle" size={22} />
              ) : (
                <MaterialIcons color="#94A3B8" name="radio-button-unchecked" size={22} />
              )}
            </ThemedView>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  optionCard: {
    alignItems: 'center',
    borderColor: '#E2E8F0',
    borderRadius: Radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionCardSelected: {
    borderColor: '#14B8A6',
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionPressable: {
    borderRadius: Radius.xl,
  },
  optionsColumn: {
    gap: 10,
  },
  scaleCard: {
    borderColor: '#E2E8F0',
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  scalePoint: {
    alignItems: 'center',
    borderColor: '#C9E6EA',
    borderRadius: Radius.pill,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  scalePointLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  scalePointLabelSelected: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  scalePointSelected: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  scaleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  scaleValue: {
    color: '#14B8A6',
    textAlign: 'center',
  },
});
