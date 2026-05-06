import { useLocalSearchParams } from 'expo-router';
import { TriageQuestionScreen } from '@/src/features/patient-triage/triage-question-screen';

export default function TriageSessionPage() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  return <TriageQuestionScreen sessionId={sessionId ?? ''} />;
}
