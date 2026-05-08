import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { TriageSpecialty } from '@/src/schemas/triage';
import { ApiError } from '@/src/services/api/api-error';
import { useTriageStore } from '@/src/store/triage-store';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';
import { useTriageSpecialty } from './use-triage-specialty';

const PALETTE = {
  bg: ['#F0F9FA', '#E0F2F1'] as const,
  primary: '#0891B2',
  teal: '#14B8A6',
  card: '#FFFFFF',
  cardBorder: 'rgba(20, 184, 166, 0.18)',
  title: '#0F172A',
  subtitle: '#475569',
  orb1: 'rgba(8, 145, 178, 0.1)',
  orb2: 'rgba(20, 184, 166, 0.1)',
};

type SpecialtyOption = {
  key: TriageSpecialty;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  description: string;
};

type SpecialtyOptionExtended = SpecialtyOption & { urgent?: boolean };

const SPECIALTIES: SpecialtyOptionExtended[] = [
  {
    key: 'GENERAL_MEDICINE',
    label: 'Medicina General',
    icon: 'local-hospital',
    description: 'Síntomas generales, fiebre, dolor, malestar',
  },
  {
    key: 'ODONTOLOGY',
    label: 'Odontología',
    icon: 'medical-services',
    description: 'Dolor dental, inflamación, sangrado bucal',
  },
  {
    key: 'URGENT_CARE',
    label: 'Urgencias',
    icon: 'emergency',
    description: 'Emergencias médicas, dolor intenso, sangrado activo, dificultad respiratoria',
    urgent: true,
  },
];

export function TriageSpecialtyScreen() {
  const router = useRouter();
  const setActiveSession = useTriageStore((s) => s.setActiveSession);
  const { createSessionMutation } = useTriageSpecialty();

  const handleSelect = async (specialty: TriageSpecialty) => {
    try {
      const session = await createSessionMutation.mutateAsync(specialty);
      setActiveSession(session.sessionId, specialty);
      router.replace(`/triage/${session.sessionId}` as any);
    } catch (err: unknown) {
      // 409 — sesión ya en progreso: extraer existingSessionId del payload envuelto en ApiError
      if (err instanceof ApiError && err.statusCode === 409) {
        const payload = (err.details as { payload?: { existingSessionId?: string } } | undefined)?.payload;
        const existingId = payload?.existingSessionId;
        if (existingId) {
          setActiveSession(existingId, specialty);
          router.replace(`/triage/${existingId}` as any);
          return;
        }
      }
    }
  };

  return (
    <LinearGradient colors={PALETTE.bg} style={styles.container}>
      <View pointerEvents="none" style={[styles.orb1, { backgroundColor: PALETTE.orb1 }]} />
      <View pointerEvents="none" style={[styles.orb2, { backgroundColor: PALETTE.orb2 }]} />

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <ThemedView style={styles.header}>
          <ThemedText style={[styles.title, { color: PALETTE.title }]}>
            ¿Qué tipo de consulta necesitas?
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: PALETTE.subtitle }]}>
            Selecciona la especialidad para iniciar el triage
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.cards}>
          {SPECIALTIES.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => void handleSelect(s.key)}
              disabled={createSessionMutation.isPending}
              style={({ pressed }) => [
                styles.card,
                s.urgent && styles.cardUrgent,
                {
                  backgroundColor: s.urgent ? '#FFF7ED' : PALETTE.card,
                  borderColor: s.urgent ? 'rgba(239, 68, 68, 0.3)' : PALETTE.cardBorder,
                  opacity: createSessionMutation.isPending ? 0.7 : pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: s.urgent ? 'rgba(239,68,68,0.12)' : 'rgba(20,184,166,0.12)' },
                ]}
              >
                <MaterialIcons name={s.icon} size={28} color={s.urgent ? '#EF4444' : PALETTE.teal} />
              </View>
              <ThemedView style={styles.cardText}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ThemedText style={[styles.cardTitle, { color: s.urgent ? '#B91C1C' : PALETTE.title }]}>
                    {s.label}
                  </ThemedText>
                  {s.urgent ? (
                    <View style={styles.urgentBadge}>
                      <ThemedText style={styles.urgentBadgeText}>URGENTE</ThemedText>
                    </View>
                  ) : null}
                </View>
                <ThemedText style={[styles.cardDesc, { color: PALETTE.subtitle }]}>
                  {s.description}
                </ThemedText>
              </ThemedView>
              {createSessionMutation.isPending ? (
                <ActivityIndicator color={s.urgent ? '#EF4444' : PALETTE.primary} />
              ) : (
                <MaterialIcons
                  name="arrow-forward-ios"
                  size={16}
                  color={s.urgent ? '#EF4444' : PALETTE.primary}
                />
              )}
            </Pressable>
          ))}
        </ThemedView>

        {createSessionMutation.isError && (
          <ThemedText style={[styles.errorText, { color: '#DC2626' }]}>
            {'Ocurrió un error. Intenta de nuevo.'}
          </ThemedText>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb1: {
    borderRadius: 200, height: 300, left: -140, position: 'absolute', top: -80, width: 300,
  },
  orb2: {
    borderRadius: 200, bottom: 60, height: 340, position: 'absolute', right: -180, width: 340,
  },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  header: { backgroundColor: 'transparent', marginBottom: 28 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3, lineHeight: 32, marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  cards: { backgroundColor: 'transparent', gap: 14 },
  card: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBadge: {
    alignItems: 'center',
    borderRadius: 40,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  cardText: { backgroundColor: 'transparent', flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 3 },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  errorText: { marginTop: 16, textAlign: 'center', fontSize: 14 },
  cardUrgent: { shadowColor: '#EF4444', shadowOpacity: 0.1 },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  urgentBadgeText: { color: '#DC2626', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});
