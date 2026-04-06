import { useLocalSearchParams } from 'expo-router';

import { TriageResultScreen } from '@/src/features/patient-triage/TriageResultScreen';

export default function TriageResultRoute() {
  const params = useLocalSearchParams<{ sessionId?: string | string[] }>();
  const rawSessionId = params.sessionId;
  const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;

  return <TriageResultScreen sessionId={sessionId ?? ''} />;
}
