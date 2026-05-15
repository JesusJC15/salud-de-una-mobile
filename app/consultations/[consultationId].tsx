import { useLocalSearchParams } from 'expo-router';

import { ConsultationDetailScreen } from '@/src/features/patient-consultations/consultation-detail-screen';

export default function ConsultationDetailRoute() {
  const { consultationId } = useLocalSearchParams<{ consultationId: string }>();

  return <ConsultationDetailScreen consultationId={consultationId ?? ''} />;
}
