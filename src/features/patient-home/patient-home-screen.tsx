import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSessionStore } from '@/src/store/session-store';
import { useTriageStore } from '@/src/store/triage-store';
import { triageService } from '@/src/features/patient-triage/triage-service';
import { useActiveConsultation } from '@/src/features/patient-consultations/use-active-consultation';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

// ─── Design Tokens ────────────────────────────────────────────────────────────

const T = {
  primary: '#14b8a6',
  primaryContainer: '#5eead4',
  secondary: '#0891b2',
  surface: '#f5fbfb',
  surfaceContainer: '#eaf7f8',
  surfaceContainerLow: '#f0fbfb',
  white: '#ffffff',
  onSurface: '#163233',
  secondaryText: '#4b666b',
  outlineVariant: '#9fc7cb',
  error: '#dc2626',
  success: '#22c55e',
  amber: '#d97706',
  cardShadow: 'rgba(20,184,166,0.06)',
} as const;

// ─── Status config ─────────────────────────────────────────────────────────

type ConsultationState =
  | 'no-session'
  | 'triage-in-progress'
  | 'waiting'
  | 'in-attention'
  | 'completed';

const STATE_CONFIG: Record<
  ConsultationState,
  {
    icon: React.ComponentProps<typeof MaterialIcons>['name'];
    iconBg: string;
    iconColor: string;
    title: string;
    subtitle: string;
    accentColor: string;
  }
> = {
  'no-session': {
    icon: 'add-circle-outline',
    iconBg: T.surfaceContainer,
    iconColor: T.primary,
    title: '¿Cómo te sentís hoy?',
    subtitle: 'Inicia una consulta y un médico te atenderá pronto',
    accentColor: T.primary,
  },
  'triage-in-progress': {
    icon: 'pending',
    iconBg: '#fef3c7',
    iconColor: T.amber,
    title: 'Triage en curso',
    subtitle: 'Completá las preguntas para que analicemos tu caso',
    accentColor: T.amber,
  },
  waiting: {
    icon: 'hourglass-top',
    iconBg: '#eff6ff',
    iconColor: '#3b82f6',
    title: 'Tu caso está en la cola',
    subtitle: 'Un médico lo revisará en breve según su prioridad',
    accentColor: '#3b82f6',
  },
  'in-attention': {
    icon: 'chat',
    iconBg: '#f0fdf4',
    iconColor: T.success,
    title: '¡Médico disponible!',
    subtitle: 'Ya podés chatear con tu médico',
    accentColor: T.success,
  },
  completed: {
    icon: 'check-circle',
    iconBg: '#f0fdf4',
    iconColor: T.success,
    title: 'Consulta atendida',
    subtitle: 'Tu caso fue resuelto. ¿Necesitás algo más?',
    accentColor: T.success,
  },
};

// ─── Sub-components ────────────────────────────────────────────────────────

function StatusHero({
  state,
  consultationId,
  onGoToChat,
}: {
  state: ConsultationState;
  consultationId?: string;
  onGoToChat?: () => void;
}) {
  const cfg = STATE_CONFIG[state];

  return (
    <LinearGradient
      colors={[T.surfaceContainer, T.surfaceContainerLow]}
      style={styles.statusHero}
    >
      <View style={[styles.statusIconWrapper, { backgroundColor: cfg.iconBg }]}>
        <MaterialIcons name={cfg.icon} size={32} color={cfg.iconColor} />
      </View>
      <View style={styles.statusTextBlock}>
        <ThemedText style={[styles.statusTitle, { color: T.onSurface }]}>
          {cfg.title}
        </ThemedText>
        <ThemedText style={[styles.statusSubtitle, { color: T.secondaryText }]}>
          {cfg.subtitle}
        </ThemedText>
      </View>

      {state === 'in-attention' && consultationId && (
        <Pressable
          onPress={onGoToChat}
          style={({ pressed }) => [
            styles.chatCta,
            { backgroundColor: T.success, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <MaterialIcons name="chat" size={16} color="#fff" />
          <ThemedText style={styles.ctaText}>Abrir chat</ThemedText>
        </Pressable>
      )}
    </LinearGradient>
  );
}

function AiSummaryCard({ summary, priority }: { summary?: string; priority?: string }) {
  if (!summary && !priority) return null;

  const priorityConfig = {
    HIGH: { label: 'Alta', bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    MODERATE: { label: 'Moderada', bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    LOW: { label: 'Baja', bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  };

  const p = priorityConfig[priority as keyof typeof priorityConfig];

  return (
    <ThemedView style={[styles.card, { backgroundColor: T.white }]}>
      <View style={styles.cardHeader}>
        <MaterialIcons name="psychology" size={16} color={T.primary} />
        <ThemedText style={[styles.cardTitle, { color: T.onSurface }]}>
          Análisis de tu caso
        </ThemedText>
        {p && (
          <View style={[styles.priorityBadge, { backgroundColor: p.bg, borderColor: p.border }]}>
            <ThemedText style={[styles.priorityText, { color: p.text }]}>
              Prioridad {p.label}
            </ThemedText>
          </View>
        )}
      </View>
      {summary ? (
        <ThemedText style={[styles.summaryText, { color: T.secondaryText }]}>
          {summary.length > 200 ? `${summary.slice(0, 200)}...` : summary}
        </ThemedText>
      ) : (
        <ThemedText style={[styles.summaryText, { color: T.outlineVariant }]}>
          El resumen estará disponible una vez que el médico lo genere.
        </ThemedText>
      )}
    </ThemedView>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  variant = 'default',
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  onPress: () => void;
  variant?: 'default' | 'primary';
}) {
  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <LinearGradient
          colors={[T.primary, T.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.primaryAction}
        >
          <MaterialIcons name={icon} size={22} color="#fff" />
          <ThemedText style={styles.primaryActionText}>{label}</ThemedText>
          <MaterialIcons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" />
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryAction,
        { backgroundColor: T.surfaceContainer, opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <View style={[styles.actionIconBadge, { backgroundColor: T.white }]}>
        <MaterialIcons name={icon} size={18} color={T.secondary} />
      </View>
      <ThemedText style={[styles.secondaryActionText, { color: T.onSurface }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function NotificationRow({
  icon,
  message,
  time,
  unread,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  message: string;
  time: string;
  unread?: boolean;
}) {
  return (
    <View style={styles.notifRow}>
      <View style={[styles.notifIconWrapper, { backgroundColor: unread ? '#eff6ff' : T.surfaceContainer }]}>
        <MaterialIcons name={icon} size={16} color={unread ? T.secondary : T.outlineVariant} />
      </View>
      <View style={styles.notifContent}>
        <ThemedText style={[styles.notifMessage, { color: T.onSurface, fontWeight: unread ? '700' : '500' }]}>
          {message}
        </ThemedText>
        <ThemedText style={[styles.notifTime, { color: T.outlineVariant }]}>{time}</ThemedText>
      </View>
      {unread && <View style={[styles.unreadDot, { backgroundColor: T.secondary }]} />}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type PatientHomeScreenProps = {
  onLoginPress: () => void;
  onRegisterPress: () => void;
  onStartTriagePress?: () => void;
  onContinueTriagePress?: (sessionId: string) => void;
  onGoToChatPress?: (consultationId: string) => void;
};

export function PatientHomeScreen({
  onLoginPress,
  onRegisterPress,
  onStartTriagePress,
  onContinueTriagePress,
  onGoToChatPress,
}: PatientHomeScreenProps) {
  const sessionStatus = useSessionStore((s) => s.status);
  const sessionUser = useSessionStore((s) => s.session?.user ?? null);
  const patientProfile = useSessionStore((s) => s.profile);
  const { activeSessionId, consultationId } = useTriageStore();

  const isAuthenticated = sessionStatus === 'authenticated' && !!sessionUser;

  // Fetch active triage sessions when authenticated
  const { data: activeSessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['triage', 'active'],
    queryFn: () => triageService.getActiveSessions(),
    enabled: isAuthenticated,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  // Fetch the most recent non-closed consultation to recover state after app restart
  const { data: activeConsultation } = useActiveConsultation();

  // Determine current state — backend data takes precedence over in-memory store
  const activeSessions = activeSessionsData?.items ?? [];
  const hasActiveSession = activeSessions.length > 0 || !!activeSessionId;
  const activeSession = activeSessions[0];
  const effectiveConsultationId = activeConsultation?.id ?? consultationId ?? null;

  const currentState: ConsultationState = (() => {
    if (hasActiveSession && activeSession?.status === 'IN_PROGRESS') return 'triage-in-progress';
    if (activeConsultation?.status === 'IN_ATTENTION') return 'in-attention';
    if (activeConsultation?.status === 'PENDING') return 'waiting';
    if (hasActiveSession && activeSession?.status === 'COMPLETED') return 'waiting';
    if (consultationId) return 'waiting'; // fallback while backend query loads
    return 'no-session';
  })()

  const firstName = patientProfile?.firstName ?? sessionUser?.email?.split('@')[0] ?? 'allí';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  // ── Unauthenticated state ─────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <LinearGradient colors={[T.surface, T.surfaceContainerLow]} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} bounces={false}>
          {/* Brand Hero */}
          <View style={styles.brandHero}>
            <LinearGradient
              colors={[T.primary, T.secondary]}
              style={styles.brandLogoWrapper}
            >
              <MaterialIcons name="health-and-safety" size={36} color="#fff" />
            </LinearGradient>
            <ThemedText style={[styles.brandName, { color: T.onSurface }]}>
              SaludDeUna
            </ThemedText>
            <ThemedText style={[styles.brandTagline, { color: T.secondaryText }]}>
              Tu salud, priorizada con inteligencia
            </ThemedText>
          </View>

          {/* Feature pills */}
          <View style={styles.featurePills}>
            {['Triage IA', 'Respuesta rápida', 'Sin esperas'].map((f) => (
              <View key={f} style={[styles.pill, { backgroundColor: T.surfaceContainer }]}>
                <ThemedText style={[styles.pillText, { color: T.secondary }]}>{f}</ThemedText>
              </View>
            ))}
          </View>

          {/* Auth actions */}
          <View style={styles.authActions}>
            <QuickAction icon="login" label="Iniciar sesión" onPress={onLoginPress} variant="primary" />
            <Pressable
              onPress={onRegisterPress}
              style={({ pressed }) => [styles.registerLink, { opacity: pressed ? 0.7 : 1 }]}
            >
              <ThemedText style={[styles.registerLinkText, { color: T.secondary }]}>
                ¿No tenés cuenta? Registrate gratis
              </ThemedText>
            </Pressable>
          </View>

          {/* Info cards */}
          <View style={styles.infoGrid}>
            {[
              { icon: 'psychology' as const, title: 'Triage Inteligente', desc: 'IA que prioriza tu caso antes de hablar con el médico' },
              { icon: 'chat' as const, title: 'Chat Directo', desc: 'Comunicate en tiempo real con tu médico asignado' },
            ].map((item) => (
              <View key={item.title} style={[styles.infoCard, { backgroundColor: T.white }]}>
                <MaterialIcons name={item.icon} size={22} color={T.primary} />
                <ThemedText style={[styles.infoCardTitle, { color: T.onSurface }]}>{item.title}</ThemedText>
                <ThemedText style={[styles.infoCardDesc, { color: T.secondaryText }]}>{item.desc}</ThemedText>
              </View>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // ── Authenticated state ───────────────────────────────────────────────────
  return (
    <LinearGradient colors={[T.surface, T.surfaceContainerLow]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} bounces={false}>

        {/* ── Greeting header ── */}
        <View style={styles.greetingRow}>
          <View>
            <ThemedText style={[styles.greetingMeta, { color: T.outlineVariant }]}>
              {greeting},
            </ThemedText>
            <ThemedText style={[styles.greetingName, { color: T.onSurface }]}>
              {firstName} 👋
            </ThemedText>
          </View>
          <View style={[styles.avatarBadge, { backgroundColor: T.primary }]}>
            <ThemedText style={styles.avatarInitial}>
              {firstName.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        </View>

        {/* ── Status Hero ── */}
        {sessionsLoading ? (
          <View style={[styles.statusHero, { backgroundColor: T.surfaceContainer, alignItems: 'center', justifyContent: 'center' }]}>
            <ActivityIndicator color={T.primary} />
          </View>
        ) : (
          <StatusHero
            state={currentState}
            consultationId={effectiveConsultationId ?? undefined}
            onGoToChat={effectiveConsultationId ? () => onGoToChatPress?.(effectiveConsultationId) : undefined}
          />
        )}

        {/* ── AI Summary (if triage is done) ── */}
        {currentState === 'waiting' && (
          <AiSummaryCard priority="MODERATE" />
        )}

        {/* ── Primary action ── */}
        <View style={styles.actionsSection}>
          {currentState === 'triage-in-progress' && activeSession ? (
            <QuickAction
              icon="pending"
              label="Continuar triage"
              onPress={() => onContinueTriagePress?.(activeSession.id)}
              variant="primary"
            />
          ) : effectiveConsultationId && (currentState === 'waiting' || currentState === 'in-attention') ? (
            <QuickAction
              icon="chat"
              label={currentState === 'in-attention' ? 'Abrir chat con médico' : 'Ver estado de mi consulta'}
              onPress={() => onGoToChatPress?.(effectiveConsultationId)}
              variant="primary"
            />
          ) : (
            <QuickAction
              icon="add-circle"
              label="Nueva consulta"
              onPress={() => onStartTriagePress?.()}
              variant="primary"
            />
          )}
        </View>

        {/* ── Quick Access Grid ── */}
        <ThemedView style={[styles.card, { backgroundColor: T.white }]}>
          <ThemedText style={[styles.cardTitle, { color: T.onSurface, marginBottom: 14 }]}>
            Acciones rápidas
          </ThemedText>
          <View style={styles.quickGrid}>
            {[
              { icon: 'history' as const, label: 'Mis consultas', onPress: () => {} },
              { icon: 'notifications' as const, label: 'Notificaciones', onPress: () => {} },
              { icon: 'person' as const, label: 'Mi perfil', onPress: () => {} },
              { icon: 'help-outline' as const, label: 'Ayuda', onPress: () => {} },
            ].map((item) => (
              <QuickAction key={item.label} icon={item.icon} label={item.label} onPress={item.onPress} />
            ))}
          </View>
        </ThemedView>

        {/* ── Notifications preview ── */}
        <ThemedView style={[styles.card, { backgroundColor: T.white }]}>
          <View style={[styles.cardHeader, { marginBottom: 14 }]}>
            <ThemedText style={[styles.cardTitle, { color: T.onSurface }]}>
              Notificaciones
            </ThemedText>
            <Pressable>
              <ThemedText style={[styles.seeAll, { color: T.secondary }]}>Ver todo</ThemedText>
            </Pressable>
          </View>
          <View style={styles.notifList}>
            <NotificationRow
              icon="chat"
              message="Un médico respondió tu consulta"
              time="Hace 2 horas"
              unread
            />
            <NotificationRow
              icon="check-circle"
              message="Tu triage fue completado exitosamente"
              time="Ayer"
            />
            <NotificationRow
              icon="info"
              message="Bienvenido a SaludDeUna"
              time="Hace 3 días"
            />
          </View>
        </ThemedView>

      </ScrollView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36, gap: 16 },

  // Brand hero (unauthenticated)
  brandHero: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  brandLogoWrapper: {
    alignItems: 'center', borderRadius: 24, height: 80, justifyContent: 'center',
    shadowColor: T.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 8, width: 80,
  },
  brandName: { fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  brandTagline: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  featurePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  pill: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  pillText: { fontSize: 13, fontWeight: '700' },
  authActions: { gap: 12 },
  registerLink: { alignItems: 'center', paddingVertical: 4 },
  registerLinkText: { fontSize: 14, fontWeight: '700' },
  infoGrid: { flexDirection: 'row', gap: 12 },
  infoCard: {
    borderRadius: 20, flex: 1, gap: 8, padding: 16,
    shadowColor: T.cardShadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 2,
  },
  infoCardTitle: { fontSize: 14, fontWeight: '800' },
  infoCardDesc: { fontSize: 12, lineHeight: 18 },

  // Greeting
  greetingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  greetingMeta: { fontSize: 13, fontWeight: '500' },
  greetingName: { fontSize: 24, fontWeight: '900', letterSpacing: -0.3 },
  avatarBadge: {
    alignItems: 'center', borderRadius: 20, height: 40, justifyContent: 'center', width: 40,
  },
  avatarInitial: { color: '#fff', fontSize: 18, fontWeight: '900' },

  // Status Hero
  statusHero: {
    borderRadius: 24, gap: 10, minHeight: 100, padding: 20,
    shadowColor: T.cardShadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 20, elevation: 2,
  },
  statusIconWrapper: {
    alignSelf: 'flex-start', borderRadius: 14, padding: 10,
  },
  statusTextBlock: { gap: 4 },
  statusTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.2 },
  statusSubtitle: { fontSize: 14, lineHeight: 20 },
  chatCta: {
    alignItems: 'center', alignSelf: 'flex-start', borderRadius: 14,
    flexDirection: 'row', gap: 8, marginTop: 4, paddingHorizontal: 16, paddingVertical: 10,
  },
  ctaText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Card
  card: {
    borderRadius: 24, padding: 20,
    shadowColor: T.cardShadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 20, elevation: 2,
  },
  cardHeader: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '800' },
  seeAll: { fontSize: 13, fontWeight: '700' },

  // AI Summary
  priorityBadge: {
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3,
  },
  priorityText: { fontSize: 11, fontWeight: '800' },
  summaryText: { fontSize: 14, lineHeight: 22 },

  // Actions
  actionsSection: { gap: 10 },
  primaryAction: {
    alignItems: 'center', borderRadius: 18, flexDirection: 'row',
    gap: 12, paddingHorizontal: 20, paddingVertical: 18,
    shadowColor: T.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 4,
  },
  primaryActionText: { color: '#fff', flex: 1, fontSize: 16, fontWeight: '800' },
  secondaryAction: {
    alignItems: 'center', borderRadius: 16, flexDirection: 'row',
    gap: 12, paddingHorizontal: 16, paddingVertical: 14,
  },
  actionIconBadge: {
    alignItems: 'center', borderRadius: 10, height: 36, justifyContent: 'center', width: 36,
  },
  secondaryActionText: { fontSize: 14, fontWeight: '700' },
  quickGrid: { gap: 8 },

  // Notifications
  notifList: { gap: 12 },
  notifRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  notifIconWrapper: {
    alignItems: 'center', borderRadius: 12, height: 36, justifyContent: 'center', width: 36,
  },
  notifContent: { flex: 1 },
  notifMessage: { fontSize: 13, lineHeight: 19 },
  notifTime: { fontSize: 11, marginTop: 2 },
  unreadDot: { borderRadius: 4, height: 8, width: 8 },
});
