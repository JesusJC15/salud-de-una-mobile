import { useLocalSearchParams } from 'expo-router';
import { TriageResultScreen } from '@/src/features/patient-triage/triage-result-screen';

export default function TriageResultPage() {
  const { priority, consultationId, message, redFlags, evidence } = useLocalSearchParams<{
    priority: string;
    consultationId: string;
    sessionId: string;
    message: string;
    redFlags: string;
    evidence: string;
  }>();

  const validPriority = ['LOW', 'MODERATE', 'HIGH'].includes(priority ?? '')
    ? (priority as 'LOW' | 'MODERATE' | 'HIGH')
    : 'LOW';

  const resolvedMessage =
    message
      ? decodeURIComponent(message)
      : validPriority === 'HIGH'
        ? 'Se detectaron signos de alarma. Tu caso fue priorizado para atención médica.'
        : 'Tu caso fue enviado a la cola médica. Un médico te atenderá en breve.';

  let parsedRedFlags: { code: string; severity: string; evidence: string }[] = [];
  if (redFlags) {
    try {
      parsedRedFlags = JSON.parse(decodeURIComponent(redFlags));
    } catch {
      // redFlags param malformed — show empty, not a crash
    }
  }

  let parsedEvidence:
    | {
        answer: string;
        grounded: boolean;
        fallback: boolean;
        citations: {
          title: string;
          authority: string;
          sectionPath?: string;
          snippet: string;
        }[];
      }
    | undefined;
  if (evidence) {
    try {
      parsedEvidence = JSON.parse(decodeURIComponent(evidence));
    } catch {
      parsedEvidence = undefined;
    }
  }

  return (
    <TriageResultScreen
      priority={validPriority}
      message={resolvedMessage}
      consultationId={consultationId ?? ''}
      redFlags={parsedRedFlags}
      evidence={parsedEvidence}
    />
  );
}
