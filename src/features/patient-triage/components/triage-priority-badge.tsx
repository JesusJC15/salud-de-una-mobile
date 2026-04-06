import { StyleSheet, View } from 'react-native';

import { Radius } from '@/src/constants/theme';
import { ThemedText } from '@/src/ui/themed-text';

type TriagePriorityBadgeProps = {
  priority: 'HIGH' | 'MODERATE' | 'LOW';
};

export function TriagePriorityBadge({ priority }: TriagePriorityBadgeProps) {
  const color = priority === 'HIGH' ? '#FCA5A5' : priority === 'MODERATE' ? '#FDE68A' : '#D1FAE5';

  return (
    <View style={[styles.wrap, { backgroundColor: color }]}>
      <ThemedText type="defaultSemiBold">{priority}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
