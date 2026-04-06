import { StyleSheet, useColorScheme, View } from 'react-native';

import { Radius } from '@/src/constants/theme';
import { ThemedText } from '@/src/ui/themed-text';

type DashboardTagTone = 'info' | 'success';

type DashboardTagProps = {
  label: string;
  tone?: DashboardTagTone;
};

const tagPalette = {
  light: {
    info: { background: '#DBEAFE', text: '#1D4ED8' },
    success: { background: '#D1FAE5', text: '#047857' },
  },
  dark: {
    info: { background: '#1E3A8A', text: '#BFDBFE' },
    success: { background: '#14532D', text: '#A7F3D0' },
  },
} as const;

export function DashboardTag({ label, tone = 'info' }: DashboardTagProps) {
  const colorScheme = useColorScheme();
  const mode = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = tagPalette[mode][tone];

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
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    fontSize: 12,
    lineHeight: 15,
  },
});
