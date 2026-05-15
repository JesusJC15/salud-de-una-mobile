import {
  getConsultationPriorityChip,
  getConsultationStatusChip,
  translateConsultationPriority,
  translateConsultationRole,
  translateConsultationSpecialty,
  translateConsultationStatus,
  translateNotificationType,
  translateSystemMessage,
  translateTimelineEventSubtitle,
  translateTimelineEventType,
} from '@/src/lib/consultation-labels';

describe('consultation labels', () => {
  it('translates known specialty, priority, status and role values', () => {
    expect(translateConsultationSpecialty('GENERAL_MEDICINE')).toBe('Medicina general');
    expect(translateConsultationPriority('HIGH')).toBe('Alta');
    expect(translateConsultationStatus('IN_ATTENTION')).toBe('En atención');
    expect(translateConsultationRole('DOCTOR')).toBe('Médico');
  });

  it('returns safe fallbacks for unknown values', () => {
    expect(translateConsultationSpecialty('UNKNOWN_SPECIALTY')).toBe('Especialidad no disponible');
    expect(translateConsultationPriority('URGENT')).toBe('No especificado');
    expect(translateConsultationStatus('ARCHIVED')).toBe('Estado no disponible');
    expect(translateConsultationRole('SYSTEM')).toBe('Rol no disponible');
  });

  it('translates notification and timeline event types with fallback', () => {
    expect(translateNotificationType('CONSULTATION_ASSIGNED')).toBe('Consulta asignada');
    expect(translateNotificationType('CUSTOM_ALERT')).toBe('Notificación del sistema');
    expect(translateTimelineEventType('FOLLOWUP_COMPLETED')).toBe('Seguimiento respondido');
    expect(translateTimelineEventType('UNKNOWN_EVENT')).toBe('Evento no disponible');
  });

  it('normalizes system messages and replaces enum tokens', () => {
    expect(
      translateSystemMessage('Especialidad: GENERAL_MEDICINE · Prioridad HIGH'),
    ).toBe('Especialidad: Medicina general · Prioridad alta');
    expect(
      translateSystemMessage('Tu verificacion como doctor fue VERIFIED.'),
    ).toBe('Tu verificación como médico fue verificada.');
    expect(
      translateSystemMessage('Seguimiento con estado UNKNOWN_STATUS'),
    ).toBe('Seguimiento con estado No especificado');
  });

  it('builds chips with safe labels when values are unknown', () => {
    expect(getConsultationPriorityChip('HIGH')).toEqual({
      label: 'Alta',
      bg: '#FEE2E2',
      text: '#B91C1C',
    });

    expect(getConsultationStatusChip('ARCHIVED')).toEqual({
      label: 'Estado no disponible',
      bg: '#E2E8F0',
      text: '#334155',
    });
  });

  it('translates timeline subtitles with safe fallback', () => {
    expect(translateTimelineEventSubtitle('Prioridad HIGH')).toBe('Prioridad alta');
    expect(translateTimelineEventSubtitle('')).toBe('Detalle no disponible');
  });
});
