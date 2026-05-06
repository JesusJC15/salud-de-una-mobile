import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTriageStore } from '@/src/store/triage-store';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

type Priority = 'LOW' | 'MODERATE' | 'HIGH';

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }> = {
  HIGH: { label: 'Alta Prioridad', color: '#DC2626', bg: '#FEF2F2', icon: 'warning' },
  MODERATE: { label: 'Prioridad Moderada', color: '#D97706', bg: '#FFFBEB', icon: 'info' },
  LOW: { label: 'Baja Prioridad', color: '#059669', bg: '#F0FDF4', icon: 'check-circle' },
};

type Props = {
  priority: Priority;
  message: string;
  consultationId: string;
  redFlags?: { code: string; severity: string; evidence: string }[];
};

export function TriageResultScreen({ priority, message, consultationId, redFlags = [] }: Props) {
  const router = useRouter();
  const clearTriage = useTriageStore((s) => s.clearTriage);
  const config = PRIORITY_CONFIG[priority];

  const handleGoToChat = () => {
    router.replace(`/triage/chat/${consultationId}` as any);
  };

  const handleGoHome = () => {
    clearTriage();
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient colors={['#F0F9FA', '#E0F2F1']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <ThemedView style={[styles.priorityBadge, { backgroundColor: config.bg, borderColor: config.color }]}>
          <MaterialIcons name={config.icon} size={36} color={config.color} />
          <ThemedText style={[styles.priorityLabel, { color: config.color }]}>
            {config.label}
          </ThemedText>
        </ThemedView>

        <ThemedView style={[styles.messageCard, { backgroundColor: '#FFFFFF', borderColor: 'rgba(20,184,166,0.18)' }]}>
          <ThemedText style={[styles.messageTitle, { color: '#0F172A' }]}>
            Resultado del análisis
          </ThemedText>
          <ThemedText style={[styles.messageText, { color: '#475569' }]}>
            {message}
          </ThemedText>
        </ThemedView>

        {redFlags.length > 0 && (
          <ThemedView style={[styles.redFlagsCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <ThemedText style={[styles.redFlagsTitle, { color: '#DC2626' }]}>
              Señales de alarma detectadas
            </ThemedText>
            {redFlags.map((rf, i) => (
              <View key={i} style={styles.redFlagRow}>
                <MaterialIcons name="warning" size={14} color="#DC2626" />
                <ThemedText style={[styles.redFlagText, { color: '#7F1D1D' }]}>
                  {rf.evidence}
                </ThemedText>
              </View>
            ))}
          </ThemedView>
        )}

        <View style={styles.actions}>
          <Pressable
            onPress={handleGoToChat}
            style={({ pressed }) => [
              styles.chatBtn,
              { backgroundColor: '#0891B2', opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <MaterialIcons name="chat" size={20} color="#FFFFFF" />
            <ThemedText style={styles.chatBtnText}>Ir al chat con el médico</ThemedText>
          </Pressable>

          <Pressable
            onPress={handleGoHome}
            style={[styles.homeBtn, { borderColor: 'rgba(20,184,166,0.3)' }]}
          >
            <ThemedText style={[styles.homeBtnText, { color: '#475569' }]}>
              Volver al inicio
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40, gap: 16 },
  priorityBadge: {
    alignItems: 'center', borderRadius: 20, borderWidth: 2,
    gap: 10, padding: 24,
  },
  priorityLabel: { fontSize: 22, fontWeight: '900' },
  messageCard: {
    borderRadius: 18, borderWidth: 1, gap: 10,
    padding: 18, shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  messageTitle: { fontSize: 16, fontWeight: '800' },
  messageText: { fontSize: 14, lineHeight: 22 },
  redFlagsCard: { borderRadius: 14, borderWidth: 1, gap: 8, padding: 16 },
  redFlagsTitle: { fontSize: 14, fontWeight: '800' },
  redFlagRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 8 },
  redFlagText: { flex: 1, fontSize: 13, lineHeight: 19 },
  actions: { gap: 12, marginTop: 8 },
  chatBtn: {
    alignItems: 'center', borderRadius: 14, flexDirection: 'row',
    gap: 8, justifyContent: 'center', minHeight: 54,
  },
  chatBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  homeBtn: {
    alignItems: 'center', borderRadius: 14, borderWidth: 1,
    justifyContent: 'center', minHeight: 48,
  },
  homeBtnText: { fontSize: 15, fontWeight: '700' },
});
