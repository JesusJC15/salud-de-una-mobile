import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSessionStore } from '@/src/store/session-store';
import { useTriageStore } from '@/src/store/triage-store';
import { triageService } from '@/src/features/patient-triage/triage-service';
import { useActiveConsultation } from '@/src/features/patient-consultations/use-active-consultation';
import { usePendingFollowups } from '@/src/features/patient-followup/use-patient-followups';
import { usePatientNotifications } from '@/src/features/patient-notifications/use-patient-notifications';
import { translateSystemMessage } from '@/src/lib/consultation-labels';
import type { NotificationListItem } from '@/src/types/notification';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

function getRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return minutes <= 1 ? 'Hace un momento' : `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days > 1 ? 's' : ''}`;
}

const NOTIFICATION_ICON_MAP: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
  FOLLOWUP_REMINDER: 'assignment-late',
  CONSULTATION_UPDATE: 'chat',
  CONSULTATION_ASSIGNED: 'medical-services',
  CONSULTATION_CLOSED: 'task-alt',
  NEW_MESSAGE: 'chat',
  CHAT_MESSAGE: 'chat',
  TRIAGE_COMPLETE: 'check-circle',
  TRIAGE_COMPLETED: 'check-circle',
  FOLLOWUP_PRIORITY_ESCALATED: 'priority-high',
  SYSTEM: 'info',
};

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
    icon: 'health-and-safety',
    iconBg: T.surfaceContainer,
    iconColor: T.primary,
    title: '¿Cómo te sientes hoy?',
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
  disabled = false,
  icon,
  label,
  loading = false,
  onPress,
  variant = 'default',
}: {
  disabled?: boolean;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  loading?: boolean;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'urgent';
}) {
  if (variant === 'primary' || variant === 'urgent') {
    const gradientColors = variant === 'urgent' ? [T.error, '#f97316'] as const : [T.primary, T.secondary] as const;

    return (
      <Pressable
        disabled={disabled || loading}
        onPress={onPress}
        style={({ pressed }) => ({ opacity: disabled || loading ? 0.72 : pressed ? 0.85 : 1 })}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.primaryAction, variant === 'urgent' && styles.urgentAction]}
        >
          <MaterialIcons name={icon} size={22} color="#fff" />
          <ThemedText style={styles.primaryActionText}>{label}</ThemedText>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <MaterialIcons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" />
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryAction,
        { backgroundColor: T.surfaceContainer, opacity: disabled || loading ? 0.72 : pressed ? 0.75 : 1 },
      ]}
    >
      <View style={[styles.actionIconBadge, { backgroundColor: T.white }]}>
        <MaterialIcons name={icon} size={18} color={T.secondary} />
      </View>
      <ThemedText style={[styles.secondaryActionText, { color: T.onSurface }]}>
        {label}
      </ThemedText>
      {loading ? <ActivityIndicator color={T.secondary} /> : null}
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

function AccountMenu({
  initial,
  isLoggingOut,
  onLogoutPress,
  onProfilePress,
}: {
  initial: string;
  isLoggingOut?: boolean;
  onLogoutPress?: () => void;
  onProfilePress?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const closeAndRun = (action?: () => void) => {
    setIsOpen(false);
    action?.();
  };

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir menú de cuenta"
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [
          styles.accountButton,
          { backgroundColor: T.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <ThemedText style={styles.avatarInitial}>{initial}</ThemedText>
        <MaterialIcons color="#FFFFFF" name="keyboard-arrow-down" size={16} />
      </Pressable>

      <Modal transparent animationType="fade" visible={isOpen} onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setIsOpen(false)}>
          <Pressable style={styles.accountMenu} onPress={() => undefined}>
            <Pressable
              accessibilityRole="button"
              onPress={() => closeAndRun(onProfilePress)}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <View style={styles.menuIconBadge}>
                <MaterialIcons color={T.secondary} name="person" size={18} />
              </View>
              <ThemedText style={styles.menuItemText}>Perfil</ThemedText>
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable
              accessibilityRole="button"
              disabled={isLoggingOut}
              onPress={() => closeAndRun(onLogoutPress)}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && !isLoggingOut && styles.menuItemPressed,
                isLoggingOut && styles.menuItemDisabled,
              ]}
            >
              <View style={[styles.menuIconBadge, styles.menuIconBadgeDanger]}>
                <MaterialIcons color={T.error} name="logout" size={18} />
              </View>
              <ThemedText style={[styles.menuItemText, styles.menuItemTextDanger]}>
                {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
              </ThemedText>
              {isLoggingOut ? <ActivityIndicator color={T.error} size="small" /> : null}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type PatientHomeScreenProps = {
  onLoginPress: () => void;
  onRegisterPress: () => void;
  onStartTriagePress?: () => void;
  onStartUrgentCarePress?: () => void;
  isStartingUrgentCare?: boolean;
  isLoggingOut?: boolean;
  onContinueTriagePress?: (sessionId: string) => void;
  onGoToChatPress?: (consultationId: string) => void;
  onLogoutPress?: () => void;
  onOpenFollowupPress?: (followupId: string) => void;
  onOpenHistoryPress?: () => void;
  onOpenNotificationsPress?: () => void;
  onOpenProfilePress?: () => void;
};

export function PatientHomeScreen({
  onLoginPress,
  onRegisterPress,
  onStartTriagePress,
  onStartUrgentCarePress,
  isStartingUrgentCare = false,
  isLoggingOut = false,
  onContinueTriagePress,
  onGoToChatPress,
  onLogoutPress,
  onOpenFollowupPress,
  onOpenHistoryPress,
  onOpenNotificationsPress,
  onOpenProfilePress,
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
  const activeConsultationQuery = useActiveConsultation();
  const activeConsultation = activeConsultationQuery.data;
  const pendingFollowupsQuery = usePendingFollowups();

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
    if (consultationId && activeConsultationQuery.isLoading) {
      return 'waiting'; // fallback while backend query loads
    }
    return 'no-session';
  })();

  const firstName = patientProfile?.firstName ?? sessionUser?.email?.split('@')[0] ?? 'allí';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const nextFollowup = pendingFollowupsQuery.data?.items[0] ?? null;
  const { notificationsQuery } = usePatientNotifications();
  const previewNotifications: NotificationListItem[] = (notificationsQuery.data?.items ?? []).slice(0, 3);

  // ── Unauthenticated state ─────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
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
      </SafeAreaView>
    );
  }

  // ── Authenticated state ───────────────────────────────────────────────────
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
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
          <AccountMenu
            initial={firstName.charAt(0).toUpperCase()}
            isLoggingOut={isLoggingOut}
            onLogoutPress={onLogoutPress}
            onProfilePress={onOpenProfilePress}
          />
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

        {nextFollowup && (
          <ThemedView style={[styles.card, styles.followupCard, { backgroundColor: T.white }]}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="assignment-late" size={18} color={T.amber} />
              <ThemedText style={[styles.cardTitle, { color: T.onSurface }]}>
                Seguimiento pendiente
              </ThemedText>
              <View style={[styles.followupBadge, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}>
                <ThemedText style={[styles.followupBadgeText, { color: T.amber }]}>
                  {pendingFollowupsQuery.data?.items.length} activo{(pendingFollowupsQuery.data?.items.length ?? 0) > 1 ? 's' : ''}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.summaryText, { color: T.secondaryText }]}>
              Responde tu control post-consulta para actualizar síntomas y priorizar atención si empeoraste.
            </ThemedText>
            <Pressable
              onPress={() => onOpenFollowupPress?.(nextFollowup.id)}
              style={({ pressed }) => [
                styles.followupCta,
                { backgroundColor: T.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <MaterialIcons name="arrow-forward" size={16} color="#fff" />
              <ThemedText style={styles.ctaText}>Responder seguimiento</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {/* ── AI Summary (if triage is done) ── */}
        {currentState === 'waiting' && (
          <AiSummaryCard
            priority={activeConsultation?.priority}
            summary={activeConsultation?.clinicalSummary ?? undefined}
          />
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
            <>
              <QuickAction
                icon="emergency"
                label={isStartingUrgentCare ? 'Iniciando urgencias...' : 'Urgencias'}
                loading={isStartingUrgentCare}
                onPress={() => onStartUrgentCarePress?.()}
                variant="urgent"
              />
              <QuickAction
                disabled={isStartingUrgentCare}
                icon="add-circle"
                label="Nueva consulta"
                onPress={() => onStartTriagePress?.()}
                variant="primary"
              />
            </>
          )}
        </View>

        {/* ── Quick Access Grid ── */}
        <ThemedView style={[styles.card, { backgroundColor: T.white }]}>
          <ThemedText style={[styles.cardTitle, { color: T.onSurface, marginBottom: 14 }]}>
            Acciones rápidas
          </ThemedText>
          <View style={styles.quickGrid}>
            {[
              { icon: 'history' as const, label: 'Mis consultas', onPress: () => onOpenHistoryPress?.() },
              { icon: 'notifications' as const, label: 'Notificaciones', onPress: () => onOpenNotificationsPress?.() },
              { icon: 'person' as const, label: 'Mi perfil', onPress: () => onOpenProfilePress?.() },
            ].map((item) => (
              <QuickAction key={item.label} icon={item.icon} label={item.label} onPress={item.onPress} />
            ))}
          </View>
        </ThemedView>

        {/* ── Notifications preview ── */}
        {previewNotifications.length > 0 && (
          <ThemedView style={[styles.card, { backgroundColor: T.white }]}>
            <View style={[styles.cardHeader, { marginBottom: 14 }]}>
              <ThemedText style={[styles.cardTitle, { color: T.onSurface }]}>
                Notificaciones
              </ThemedText>
              <Pressable onPress={() => onOpenNotificationsPress?.()}>
                <ThemedText style={[styles.seeAll, { color: T.secondary }]}>Ver todo</ThemedText>
              </Pressable>
            </View>
            <View style={styles.notifList}>
              {previewNotifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  icon={NOTIFICATION_ICON_MAP[n.type] ?? 'notifications'}
                  message={translateSystemMessage(n.message, 'Mensaje no disponible')}
                  time={getRelativeTime(n.createdAt)}
                  unread={!n.read}
                />
              ))}
            </View>
          </ThemedView>
        )}

        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
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
  accountButton: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 1,
    height: 40,
    justifyContent: 'center',
    paddingLeft: 13,
    paddingRight: 8,
  },
  avatarInitial: { color: '#fff', fontSize: 18, fontWeight: '900' },
  menuOverlay: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 72,
  },
  accountMenu: {
    alignSelf: 'flex-end',
    backgroundColor: T.white,
    borderColor: 'rgba(20,184,166,0.18)',
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 210,
    padding: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  menuItem: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    minHeight: 46,
    paddingHorizontal: 10,
  },
  menuItemPressed: {
    backgroundColor: T.surfaceContainer,
  },
  menuItemDisabled: {
    opacity: 0.7,
  },
  menuIconBadge: {
    alignItems: 'center',
    backgroundColor: T.surfaceContainer,
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  menuIconBadgeDanger: {
    backgroundColor: '#fef2f2',
  },
  menuItemText: {
    color: T.onSurface,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  menuItemTextDanger: {
    color: T.error,
  },
  menuDivider: {
    backgroundColor: '#E2EEF4',
    height: 1,
    marginVertical: 4,
  },

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
  followupCard: { gap: 14 },
  followupBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  followupBadgeText: { fontSize: 11, fontWeight: '800' },
  followupCta: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // Actions
  actionsSection: { gap: 10 },
  primaryAction: {
    alignItems: 'center', borderRadius: 18, flexDirection: 'row',
    gap: 12, paddingHorizontal: 20, paddingVertical: 18,
    shadowColor: T.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 4,
  },
  urgentAction: {
    shadowColor: T.error,
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
