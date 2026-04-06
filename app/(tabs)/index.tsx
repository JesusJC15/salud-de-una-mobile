import { useRouter } from 'expo-router';

import { PatientHomeScreen } from '@/src/features/patient-home/patient-home-screen';

export default function HomeScreen() {
  const router = useRouter();
  const openCases = () => router.push('/(tabs)/notifications');
  const openProfile = () => router.push('/(tabs)/profile');

  return (
    <PatientHomeScreen
      onCasesPress={openCases}
      onPrimaryActionPress={openCases}
      onProfilePress={openProfile}
      onSettingsPress={openProfile}
      onViewAllPress={openCases}
    />
  );
}
