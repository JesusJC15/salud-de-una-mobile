import { useLocalSearchParams } from 'expo-router';
import { TriageResultScreen } from '@/src/features/patient-triage/triage-result-screen';

export default function TriageResultPage() {
  const { priority, consultationId, sessionId } = useLocalSearchParams<{
    priority: string;
    consultationId: string;
    sessionId: string;
  }>();

  const validPriority = ['LOW', 'MODERATE', 'HIGH'].includes(priority ?? '')
    ? (priority as 'LOW' | 'MODERATE' | 'HIGH')
    : 'LOW';

  return (
    <TriageResultScreen
      priority={validPriority}
      message={
        validPriority === 'HIGH'
          ? 'Se detectaron signos de alarma. Tu caso fue priorizado para atención médica.'
          : 'Tu caso fue enviado a la cola médica. Un médico te atenderá en breve.'
      }
      consultationId={consultationId ?? ''}
    />
  );
}
