import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Radius } from '@/src/constants/theme';
import { TriageActiveSession } from '@/src/types/triage';
import { AppButton } from '@/src/ui/button';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

type TriageActiveSessionCardProps = Readonly<{
  session: TriageActiveSession;
  isCanceling: boolean;
  onCancel: (session: TriageActiveSession) => void;
  onResume: (session: TriageActiveSession) => void;
}>;

function formatSpecialtyLabel(specialty: TriageActiveSession['specialty']) {
  if (specialty === 'GENERAL_MEDICINE') {
    return 'Medicina General';
  }

  return 'Odontologia';
}

function getProgressCopy(session: TriageActiveSession) {
  if (session.totalSteps <= 0) {
    return 'Sin preguntas cargadas';
  }

  if (session.isComplete) {
    return `Completado (${session.totalSteps}/${session.totalSteps})`;
  }

  return `Paso ${session.currentStep} de ${session.totalSteps}`;
}

export function TriageActiveSessionCard({
  session,
  isCanceling,
  onCancel,
  onResume,
}: TriageActiveSessionCardProps) {
  const progressPercent = session.totalSteps > 0
    ? Math.round((session.currentStep / session.totalSteps) * 100)
    : 0;

  return (
    <ThemedView darkColor="#0D3E43" lightColor="#FFFFFF" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <ThemedText type="defaultSemiBold">{formatSpecialtyLabel(session.specialty)}</ThemedText>
          <ThemedText type="muted">{getProgressCopy(session)}</ThemedText>
        </View>

        <View style={styles.badge}>
          <MaterialIcons color="#0E9F8E" name="autorenew" size={14} />
          <ThemedText style={styles.badgeText} type="defaultSemiBold">
            En progreso
          </ThemedText>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
      </View>

      <View style={styles.actionsRow}>
        <View style={styles.actionItem}>
          <AppButton label="Reanudar" onPress={() => onResume(session)} />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isCanceling}
          onPress={() => onCancel(session)}
          style={({ pressed }) => {
            let opacity = 1;

            if (isCanceling) {
              opacity = 0.55;
            } else if (pressed) {
              opacity = 0.72;
            }

            return [styles.cancelLink, { opacity }];
          }}>
          <MaterialIcons color="#D14343" name="close" size={14} />
          <ThemedText style={styles.cancelText} type="defaultSemiBold">
            Cancelar
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  actionItem: {
    flex: 1,
  },
  actionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#E9FCF9',
    borderColor: '#A8EDE4',
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#0E8F82',
    fontSize: 11,
    lineHeight: 14,
  },
  cancelLink: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 6,
  },
  cancelText: {
    color: '#D14343',
  },
  card: {
    borderColor: '#D2ECEE',
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  progressFill: {
    backgroundColor: '#14B8A6',
    borderRadius: Radius.pill,
    height: 8,
  },
  progressTrack: {
    backgroundColor: '#DBF2F4',
    borderRadius: Radius.pill,
    height: 8,
    overflow: 'hidden',
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
});
