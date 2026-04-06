import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius } from '@/src/constants/theme';
import { TriageSpecialty } from '@/src/types/triage';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

type TriageSpecialtyOptionCardProps = {
  selected: boolean;
  specialty: TriageSpecialty;
  subtitle: string;
  title: string;
  onPress: (specialty: TriageSpecialty) => void;
};

export function TriageSpecialtyOptionCard({
  selected,
  specialty,
  subtitle,
  title,
  onPress,
}: TriageSpecialtyOptionCardProps) {
  const iconName = specialty === 'GENERAL_MEDICINE' ? 'medical-services' : 'healing';

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => onPress(specialty)}
      style={({ pressed }) => [styles.pressable, { opacity: pressed ? 0.92 : 1 }]}
    >
      <ThemedView
        darkColor={selected ? '#0F4F55' : '#0D3E43'}
        lightColor={selected ? '#E0FAF8' : '#FFFFFF'}
        style={[styles.card, selected ? styles.selectedCard : undefined]}>
        <View style={[styles.iconWrap, selected ? styles.selectedIconWrap : undefined]}>
          <MaterialIcons color="#14B8A6" name={iconName} size={20} />
        </View>

        <View style={styles.content}>
          <ThemedText type="defaultSemiBold">{title}</ThemedText>
          <ThemedText type="muted">{subtitle}</ThemedText>
        </View>

        <MaterialIcons color={selected ? '#14B8A6' : '#9CA3AF'} name="chevron-right" size={20} />
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderColor: '#E2E8F0',
    borderRadius: Radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#EAFBFA',
    borderRadius: Radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  pressable: {
    borderRadius: Radius.xl,
  },
  selectedCard: {
    borderColor: '#14B8A6',
  },
  selectedIconWrap: {
    backgroundColor: '#CCF7F3',
  },
});
