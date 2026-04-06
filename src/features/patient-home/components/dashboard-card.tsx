import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { Radius } from '@/src/constants/theme';
import { ThemedView } from '@/src/ui/themed-view';

type DashboardCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  lightColor?: string;
  darkColor?: string;
}>;

export function DashboardCard({
  children,
  style,
  lightColor = '#FFFFFF',
  darkColor = '#0D3E43',
}: DashboardCardProps) {
  return (
    <ThemedView lightColor={lightColor} darkColor={darkColor} style={[styles.card, style]}>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 3,
  },
});
