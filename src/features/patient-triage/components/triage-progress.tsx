import { StyleSheet, View } from 'react-native';

import { Radius } from '@/src/constants/theme';
import { ThemedText } from '@/src/ui/themed-text';

type TriageProgressProps = {
  label: string;
  step: number;
  total: number;
};

export function TriageProgress({ label, step, total }: TriageProgressProps) {
  const safeTotal = Math.max(total, 1);
  const safeStep = Math.min(Math.max(step, 1), safeTotal);
  const progress = safeStep / safeTotal;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ThemedText type="defaultSemiBold">{label}</ThemedText>
        <ThemedText style={styles.stepText} type="eyebrow">
          PASO {safeStep} DE {safeTotal}
        </ThemedText>
      </View>
      <View accessibilityLabel={`Progreso ${safeStep} de ${safeTotal}`} accessibilityRole="progressbar" style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(progress * 100, 4)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  fill: {
    backgroundColor: '#14B8A6',
    borderRadius: Radius.pill,
    height: 6,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepText: {
    color: '#14B8A6',
    letterSpacing: 0.6,
  },
  track: {
    backgroundColor: '#D9EDF0',
    borderRadius: Radius.pill,
    height: 6,
    overflow: 'hidden',
  },
});
