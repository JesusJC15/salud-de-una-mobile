import { useRouter } from 'expo-router';

import { PatientHomeScreen } from '@/src/features/patient-home/patient-home-screen';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <PatientHomeScreen
      onLoginPress={() => router.push('/(auth)/login')}
      onRegisterPress={() => router.push('/(auth)/register')}
    />
  );
}
