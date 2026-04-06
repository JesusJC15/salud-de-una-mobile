import { useLocalSearchParams } from 'expo-router';

import { TriageQuestionnaireScreen } from '@/src/features/patient-triage/TriageQuestionnaireScreen';

export default function TriageQuestionnaireRoute() {
  const params = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const rawSessionId = params.sessionId;
  const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;

  return <TriageQuestionnaireScreen sessionId={sessionId ?? ''} />;
}
