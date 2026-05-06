import { useLocalSearchParams } from 'expo-router';
import { FollowupScreen } from '@/src/features/patient-followup/followup-screen';

export default function Page() {
  const params = useLocalSearchParams<{ followupId?: string | string[] }>();
  const followupId = Array.isArray(params.followupId)
    ? params.followupId[0] ?? ''
    : params.followupId ?? '';

  return <FollowupScreen followupId={followupId} />;
}
