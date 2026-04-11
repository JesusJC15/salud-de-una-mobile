import { StyleSheet, View } from 'react-native';

import { Radius } from '@/src/constants/theme';
import { ThemedText } from '@/src/ui/themed-text';

type TriagePriorityBadgeProps = Readonly<{
  priority: 'HIGH' | 'MODERATE' | 'LOW';
}>;

export function TriagePriorityBadge({ priority }: TriagePriorityBadgeProps) {
  let color = '#D1FAE5';
  let textColor = '#065F46';

  if (priority === 'HIGH') {
    color = '#FCA5A5';
    textColor = '#7F1D1D';
  }

  if (priority === 'MODERATE') {
    color = '#FDE68A';
    textColor = '#854D0E';
  }

  return (
    <View style={[styles.wrap, { backgroundColor: color }]}>
      <ThemedText darkColor={textColor} lightColor={textColor} style={styles.label} type="defaultSemiBold">
        {priority}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    letterSpacing: 0.4,
  },
  wrap: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
