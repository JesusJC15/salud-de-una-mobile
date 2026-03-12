import { useRouter } from 'expo-router';

import { PatientHomeScreen } from '@/src/features/patient-home/patient-home-screen';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <PatientHomeScreen
      onLoginPress={() => router.push('../login')}
      onRegisterPress={() => router.push('../register')}
    />
  );
}
