import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { Pressable, StyleProp, StyleSheet, useColorScheme, View, ViewStyle } from 'react-native';

import { Radius } from '@/src/constants/theme';
import { ThemedText } from '@/src/ui/themed-text';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

export type BottomNavItem = {
  key: string;
  label: string;
  iconName: IconName;
  onPress?: () => void;
  accessibilityLabel?: string;
};

type DashboardBottomNavProps = {
  items: BottomNavItem[];
  activeKey: string;
  style?: StyleProp<ViewStyle>;
};

const navPalette = {
  light: {
    active: '#1E63D6',
    background: '#FFFFFF',
    border: '#E4E7EC',
    inactive: '#98A2B3',
  },
  dark: {
    active: '#60A5FA',
    background: '#0F172A',
    border: '#1F2937',
    inactive: '#9CA3AF',
  },
} as const;

export function DashboardBottomNav({ items, activeKey, style }: DashboardBottomNavProps) {
  const colorScheme = useColorScheme();
  const mode = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = navPalette[mode];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.background,
          borderTopColor: palette.border,
        },
        style,
      ]}>
      {items.map((item) => {
        const isActive = item.key === activeKey;
        const color = isActive ? palette.active : palette.inactive;

        return (
          <Pressable
            accessibilityLabel={item.accessibilityLabel ?? item.label}
            accessibilityRole="button"
            key={item.key}
            onPress={item.onPress}
            style={styles.item}>
            <MaterialIcons color={color} name={item.iconName} size={22} />
            <ThemedText
              style={[styles.itemLabel, { color }]}
              type={isActive ? 'defaultSemiBold' : 'muted'}>
              {item.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingBottom: 12,
    paddingHorizontal: 8,
    paddingTop: 10,
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  item: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    paddingVertical: 2,
  },
  itemLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
});
