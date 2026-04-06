import { useColorScheme, View, StyleSheet } from 'react-native';

import { Radius } from '@/src/constants/theme';
import { ThemedText } from '@/src/ui/themed-text';

type DashboardBadgeTone = 'warning' | 'neutral' | 'success';

type DashboardBadgeProps = {
  label: string;
  tone?: DashboardBadgeTone;
};

const badgePalette = {
  light: {
    neutral: { background: '#EEF2F7', text: '#475467' },
    success: { background: '#D1FADF', text: '#067647' },
    warning: { background: '#FEF0C7', text: '#B54708' },
  },
  dark: {
    neutral: { background: '#1F2937', text: '#D0D5DD' },
    success: { background: '#14532D', text: '#86EFAC' },
    warning: { background: '#78350F', text: '#FDE68A' },
  },
} as const;

export function DashboardBadge({ label, tone = 'neutral' }: DashboardBadgeProps) {
  const colorScheme = useColorScheme();
  const mode = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = badgePalette[mode][tone];

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}> 
      <ThemedText style={[styles.label, { color: palette.text }]} type="defaultSemiBold">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    fontSize: 12,
    lineHeight: 15,
  },
});
