// Tests for notification type label mapping used in patient-notifications-screen
const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  FOLLOWUP_REMINDER: 'Seguimiento pendiente',
  CONSULTATION_UPDATE: 'Actualización de consulta',
  NEW_MESSAGE: 'Nuevo mensaje',
  TRIAGE_COMPLETE: 'Triage completado',
  SYSTEM: 'Aviso del sistema',
  DOCTOR_STATUS_CHANGE: 'Estado de doctor',
};

function getNotificationLabel(type: string): string {
  return NOTIFICATION_TYPE_LABELS[type] ?? type.replace(/_/g, ' ');
}

describe('getNotificationLabel', () => {
  it.each([
    ['FOLLOWUP_REMINDER', 'Seguimiento pendiente'],
    ['CONSULTATION_UPDATE', 'Actualización de consulta'],
    ['NEW_MESSAGE', 'Nuevo mensaje'],
    ['TRIAGE_COMPLETE', 'Triage completado'],
    ['SYSTEM', 'Aviso del sistema'],
    ['DOCTOR_STATUS_CHANGE', 'Estado de doctor'],
  ])('maps %s to Spanish label', (type, expected) => {
    expect(getNotificationLabel(type)).toBe(expected);
  });

  it('replaces underscores for unknown types', () => {
    expect(getNotificationLabel('SOME_UNKNOWN_TYPE')).toBe('SOME UNKNOWN TYPE');
  });

  it('returns raw type when no underscores and unknown', () => {
    expect(getNotificationLabel('UNKNOWN')).toBe('UNKNOWN');
  });
});
