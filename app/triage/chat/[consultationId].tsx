import { useLocalSearchParams } from 'expo-router';
import { PatientChatScreen } from '@/src/features/patient-chat/patient-chat-screen';

export default function PatientChatPage() {
  const { consultationId, closed } = useLocalSearchParams<{
    consultationId: string;
    closed?: string;
  }>();
  return (
    <PatientChatScreen
      consultationId={consultationId ?? ''}
      isClosed={closed === '1'}
    />
  );
}
