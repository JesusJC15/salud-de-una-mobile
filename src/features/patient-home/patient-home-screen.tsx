import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius } from '@/src/constants/theme';
import { DashboardBadge } from '@/src/features/patient-home/components/dashboard-badge';
import {
  BottomNavItem,
  DashboardBottomNav,
} from '@/src/features/patient-home/components/dashboard-bottom-nav';
import { DashboardButton } from '@/src/features/patient-home/components/dashboard-button';
import { DashboardCard } from '@/src/features/patient-home/components/dashboard-card';
import { DashboardTag } from '@/src/features/patient-home/components/dashboard-tag';
import { getInitials, getProfileDisplayName } from '@/src/lib/identity';
import { useSessionStore } from '@/src/store/session-store';
import { ThemedText } from '@/src/ui/themed-text';
import { ThemedView } from '@/src/ui/themed-view';

type PatientHomeScreenProps = {
  onCasesPress?: () => void;
  onPrimaryActionPress?: () => void;
  onProfilePress?: () => void;
  onSettingsPress?: () => void;
  onTriagePress?: () => void;
  onViewAllPress?: () => void;
};

const noop = () => undefined;

export function PatientHomeScreen({
  onCasesPress,
  onPrimaryActionPress,
  onProfilePress,
  onSettingsPress,
  onTriagePress,
  onViewAllPress,
}: PatientHomeScreenProps) {
  const sessionUser = useSessionStore((state) => state.session?.user ?? null);
  const patientProfile = useSessionStore((state) => state.profile);
  const profileDisplayName = getProfileDisplayName(patientProfile);
  const displayName =
    profileDisplayName === 'Paciente'
      ? sessionUser?.email?.split('@')[0] ?? 'John Doe'
      : profileDisplayName;
  const initials = getInitials(patientProfile?.firstName, patientProfile?.lastName);
  const openCases = onCasesPress ?? onViewAllPress ?? noop;

  const bottomNavItems: BottomNavItem[] = [
    {
      key: 'home',
      label: 'Home',
      iconName: 'home',
      accessibilityLabel: 'Home tab',
    },
    {
      key: 'cases',
      label: 'Cases',
      iconName: 'assignment',
      onPress: openCases,
      accessibilityLabel: 'Cases tab',
    },
    {
      key: 'profile',
      label: 'Profile',
      iconName: 'person',
      onPress: onProfilePress,
      accessibilityLabel: 'Profile tab',
    },
    {
      key: 'settings',
      label: 'Settings',
      iconName: 'settings',
      onPress: onSettingsPress,
      accessibilityLabel: 'Settings tab',
    },
  ];

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ThemedView lightColor="#EEF2F6" darkColor="#06171F" style={styles.page}>
        <View style={styles.deviceContainer}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            style={styles.scrollArea}>
            <DashboardCard lightColor="#FCFCFD" darkColor="#0F2532" style={styles.headerCard}>
              <View style={styles.headerRow}>
                <View style={styles.profileRow}>
                  <View style={styles.avatar}>
                    <ThemedText style={styles.avatarText} type="defaultSemiBold">
                      {initials}
                    </ThemedText>
                  </View>

                  <View style={styles.headerTextWrap}>
                    <ThemedText style={styles.welcomeLabel} type="muted">
                      Welcome back,
                    </ThemedText>
                    <ThemedText style={styles.userName} type="defaultSemiBold">
                      {displayName}
                    </ThemedText>
                  </View>
                </View>

                <View
                  accessibilityLabel="Notification center"
                  accessibilityRole="image"
                  style={styles.notificationWrap}>
                  <MaterialIcons color="#667085" name="notifications-none" size={21} />
                  <View style={styles.notificationDot} />
                </View>
              </View>
            </DashboardCard>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle} type="subtitle">
                Quick Actions
              </ThemedText>

              <View style={styles.quickActionsGrid}>
                <DashboardButton
                  accessibilityLabel="Start consultation"
                  iconName="medical-services"
                  label="Start Consultation"
                  layout="stacked"
                  onPress={onPrimaryActionPress ?? openCases}
                  style={styles.quickActionItem}
                  variant="primary"
                />

                <DashboardButton
                  accessibilityLabel="Create triage"
                  iconName="fact-check"
                  label="New Triage"
                  layout="stacked"
                  onPress={onTriagePress ?? openCases}
                  style={styles.quickActionItem}
                  variant="secondary"
                />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <ThemedText style={styles.sectionTitle} type="subtitle">
                  Ongoing Cases
                </ThemedText>
                <Pressable
                  accessibilityLabel="View all cases"
                  accessibilityRole="button"
                  onPress={onViewAllPress ?? openCases}
                  style={styles.viewAllAction}>
                  <ThemedText style={styles.viewAllLabel} type="defaultSemiBold">
                    View All
                  </ThemedText>
                </Pressable>
              </View>

              <DashboardCard lightColor="#FCFCFD" darkColor="#0F2532" style={styles.caseCard}>
                <View style={styles.caseTopRow}>
                  <DashboardTag label="General Medicine" tone="info" />
                  <DashboardBadge label="Priority: Medium" tone="warning" />
                </View>

                <ThemedText style={styles.caseTitle} type="defaultSemiBold">
                  Seasonal Influenza Symptoms
                </ThemedText>

                <View style={styles.caseMetaRow}>
                  <MaterialIcons color="#98A2B3" name="hourglass-top" size={16} />
                  <ThemedText style={styles.caseMetaText} type="muted">
                    Waiting for doctor assignment...
                  </ThemedText>
                </View>
              </DashboardCard>

              <DashboardCard lightColor="#FCFCFD" darkColor="#0F2532" style={styles.caseCard}>
                <View style={styles.caseTopRow}>
                  <DashboardTag label="Dentistry" tone="success" />
                  <DashboardBadge label="Scheduled" tone="neutral" />
                </View>

                <ThemedText style={styles.caseTitle} type="defaultSemiBold">
                  Routine Check-up
                </ThemedText>

                <View style={styles.caseMetaRow}>
                  <MaterialIcons color="#1570EF" name="event" size={16} />
                  <ThemedText style={styles.caseMetaText} type="muted">
                    Tomorrow at 10:30 AM
                  </ThemedText>
                </View>
              </DashboardCard>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle} type="subtitle">
                Health Summary
              </ThemedText>

              <DashboardCard lightColor="#FEF3F2" darkColor="#4A0F17" style={styles.alertCard}>
                <View style={styles.alertTitleRow}>
                  <MaterialIcons color="#D92D20" name="warning-amber" size={20} />
                  <ThemedText style={styles.alertTitle} type="defaultSemiBold">
                    Triage Red Flags
                  </ThemedText>
                </View>

                <ThemedText style={styles.alertCopy}>
                  Persistent cough and high fever (&gt;38.5 C) detected in your last triage.
                  Monitor respiratory rate closely.
                </ThemedText>

                <View style={styles.alertActions}>
                  <DashboardButton
                    accessibilityLabel="Request urgent support"
                    label="Urgent Support"
                    onPress={openCases}
                    style={styles.alertAction}
                    variant="destructive"
                  />

                  <DashboardButton
                    accessibilityLabel="Dismiss red flags"
                    label="Dismiss"
                    style={styles.alertAction}
                    variant="outline"
                  />
                </View>
              </DashboardCard>

              <View style={styles.statsGrid}>
                <DashboardCard lightColor="#F8FAFC" darkColor="#0F2532" style={styles.statsCard}>
                  <ThemedText style={styles.statsLabel} type="muted">
                    Resting HR
                  </ThemedText>
                  <ThemedText style={styles.statsValue} type="defaultSemiBold">
                    72 bpm
                  </ThemedText>
                  <View style={styles.stableRow}>
                    <MaterialIcons color="#12B76A" name="trending-up" size={14} />
                    <ThemedText style={styles.stableText} type="defaultSemiBold">
                      Stable
                    </ThemedText>
                  </View>
                </DashboardCard>

                <DashboardCard lightColor="#F8FAFC" darkColor="#0F2532" style={styles.statsCard}>
                  <ThemedText style={styles.statsLabel} type="muted">
                    Last Triage
                  </ThemedText>
                  <ThemedText style={styles.statsValue} type="defaultSemiBold">
                    Jan 12
                  </ThemedText>
                  <ThemedText style={styles.statsMeta} type="muted">
                    2 days ago
                  </ThemedText>
                </DashboardCard>
              </View>
            </View>
          </ScrollView>

          <DashboardBottomNav activeKey="home" items={bottomNavItems} style={styles.bottomNav} />
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  deviceContainer: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: 375,
    width: '100%',
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    gap: 20,
    paddingBottom: 124,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: Radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  avatarText: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 15,
  },
  headerTextWrap: {
    gap: 1,
  },
  welcomeLabel: {
    fontSize: 13,
    lineHeight: 16,
  },
  userName: {
    fontSize: 24,
    lineHeight: 28,
  },
  notificationWrap: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 34,
    justifyContent: 'center',
    position: 'relative',
    width: 34,
  },
  notificationDot: {
    backgroundColor: '#D92D20',
    borderRadius: Radius.pill,
    height: 7,
    position: 'absolute',
    right: 6,
    top: 5,
    width: 7,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 28,
    lineHeight: 32,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionItem: {
    flex: 1,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewAllAction: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  viewAllLabel: {
    color: '#1D4ED8',
    fontSize: 14,
    lineHeight: 18,
  },
  caseCard: {
    gap: 10,
    padding: 14,
  },
  caseTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  caseTitle: {
    fontSize: 27,
    lineHeight: 31,
  },
  caseMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  caseMetaText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
  },
  alertCard: {
    borderColor: '#FECDCA',
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  alertTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  alertTitle: {
    color: '#B42318',
    fontSize: 28,
    lineHeight: 32,
  },
  alertCopy: {
    color: '#B42318',
    fontSize: 15,
    lineHeight: 21,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  alertAction: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    gap: 6,
    minHeight: 116,
    padding: 14,
  },
  statsLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  statsValue: {
    fontSize: 36,
    lineHeight: 38,
  },
  statsMeta: {
    fontSize: 13,
    lineHeight: 17,
  },
  stableRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  stableText: {
    color: '#12B76A',
    fontSize: 12,
    lineHeight: 15,
  },
  bottomNav: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});