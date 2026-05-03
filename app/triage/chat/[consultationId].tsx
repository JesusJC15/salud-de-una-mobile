import { useLocalSearchParams } from 'expo-router';
import { PatientChatScreen } from '@/src/features/patient-chat/patient-chat-screen';

export default function PatientChatPage() {
  const { consultationId } = useLocalSearchParams<{ consultationId: string }>();
  return <PatientChatScreen consultationId={consultationId ?? ''} />;
}
