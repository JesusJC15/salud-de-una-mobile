type LabelMap = Record<string, string>;

type ChipColors = {
  bg: string;
  text: string;
};

const CONSULTATION_SPECIALTY_LABELS: LabelMap = {
  GENERAL_MEDICINE: 'Medicina general',
  ODONTOLOGY: 'Odontología',
  URGENT_CARE: 'Urgencias',
};

const CONSULTATION_PRIORITY_LABELS: LabelMap = {
  HIGH: 'Alta',
  MODERATE: 'Moderada',
  LOW: 'Baja',
};

const CONSULTATION_STATUS_LABELS: LabelMap = {
  PENDING: 'Pendiente',
  IN_ATTENTION: 'En atención',
  CLOSED: 'Cerrada',
};

const CONSULTATION_ROLE_LABELS: LabelMap = {
  PATIENT: 'Tú',
  DOCTOR: 'Médico',
  ADMIN: 'Administrador',
};

const NOTIFICATION_TYPE_LABELS: LabelMap = {
  FOLLOWUP_REMINDER: 'Seguimiento pendiente',
  CONSULTATION_UPDATE: 'Actualización de consulta',
  CONSULTATION_ASSIGNED: 'Consulta asignada',
  CONSULTATION_CLOSED: 'Consulta cerrada',
  NEW_MESSAGE: 'Nuevo mensaje',
  CHAT_MESSAGE: 'Nuevo mensaje',
  TRIAGE_COMPLETE: 'Triage completado',
  TRIAGE_COMPLETED: 'Triage completado',
  SYSTEM: 'Aviso del sistema',
  DOCTOR_STATUS_CHANGE: 'Estado de médico',
  FOLLOWUP_PRIORITY_ESCALATED: 'Prioridad escalada',
  FOLLOWUP_CREATED: 'Seguimiento programado',
  FOLLOWUP_DUE: 'Seguimiento disponible',
  FOLLOWUP_COMPLETED: 'Seguimiento respondido',
  PRIORITY_ESCALATED: 'Caso repriorizado',
};

const TIMELINE_EVENT_TYPE_LABELS: LabelMap = {
  TRIAGE_COMPLETED: 'Triage completado',
  CONSULTATION_ASSIGNED: 'Consulta asignada',
  CONSULTATION_CLOSED: 'Consulta cerrada',
  FOLLOWUP_CREATED: 'Seguimiento programado',
  FOLLOWUP_DUE: 'Seguimiento disponible',
  FOLLOWUP_COMPLETED: 'Seguimiento respondido',
  PRIORITY_ESCALATED: 'Caso repriorizado',
};

const PRIORITY_CHIP_COLORS: Record<string, ChipColors> = {
  HIGH: { bg: '#FEE2E2', text: '#B91C1C' },
  MODERATE: { bg: '#FEF9C3', text: '#92400E' },
  LOW: { bg: '#D1FAE5', text: '#065F46' },
};

const DEFAULT_PRIORITY_CHIP_COLORS: ChipColors = {
  bg: '#E2E8F0',
  text: '#334155',
};

const STATUS_CHIP_COLORS: Record<string, ChipColors> = {
  PENDING: { bg: '#F1F5F9', text: '#475569' },
  IN_ATTENTION: { bg: '#DBEAFE', text: '#1E40AF' },
  CLOSED: { bg: '#CCFBF1', text: '#0F766E' },
};

const DEFAULT_STATUS_CHIP_COLORS: ChipColors = {
  bg: '#E2E8F0',
  text: '#334155',
};

const INLINE_ENUM_LABELS: LabelMap = {
  GENERAL_MEDICINE: 'Medicina general',
  ODONTOLOGY: 'Odontología',
  URGENT_CARE: 'Urgencias',
  HIGH: 'alta',
  MODERATE: 'moderada',
  LOW: 'baja',
  PENDING: 'pendiente',
  IN_ATTENTION: 'en atención',
  CLOSED: 'cerrada',
  PATIENT: 'paciente',
  DOCTOR: 'médico',
  ADMIN: 'administrador',
  VERIFIED: 'verificada',
  REJECTED: 'rechazada',
  REMINDED: 'recordado',
  COMPLETED: 'completado',
  MISSED: 'vencido',
  IN_PROGRESS: 'en progreso',
  ACTION_REQUIRED: 'acción requerida',
};

const SAFE_TEXT = {
  default: 'No especificado',
  specialty: 'Especialidad no disponible',
  priority: 'No especificado',
  status: 'Estado no disponible',
  role: 'Rol no disponible',
  timelineEvent: 'Evento no disponible',
  timelineDetail: 'Detalle no disponible',
  notificationType: 'Notificación del sistema',
  message: 'Mensaje no disponible',
} as const;

export const CONSULTATION_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'IN_ATTENTION', label: 'En atención' },
  { value: 'CLOSED', label: 'Cerrada' },
] as const;

function normalizeEnumKey(value: string | undefined | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

function resolveLabel(labels: LabelMap, value: string | undefined | null, fallback: string): string {
  const key = normalizeEnumKey(value);
  if (!key) {
    return fallback;
  }

  return labels[key] ?? fallback;
}

function replaceEnumTokens(text: string): string {
  return text.replace(/\b[A-Z_]{3,}\b/g, (token) => {
    const translated = INLINE_ENUM_LABELS[token];
    if (translated) {
      return translated;
    }

    if (token.includes('_') || token.length >= 4) {
      return SAFE_TEXT.default;
    }

    return token;
  });
}

export function translateConsultationSpecialty(specialty: string | undefined | null): string {
  return resolveLabel(CONSULTATION_SPECIALTY_LABELS, specialty, SAFE_TEXT.specialty);
}

export function translateConsultationPriority(priority: string | undefined | null): string {
  return resolveLabel(CONSULTATION_PRIORITY_LABELS, priority, SAFE_TEXT.priority);
}

export function translateConsultationStatus(status: string | undefined | null): string {
  return resolveLabel(CONSULTATION_STATUS_LABELS, status, SAFE_TEXT.status);
}

export function translateConsultationRole(role: string | undefined | null): string {
  return resolveLabel(CONSULTATION_ROLE_LABELS, role, SAFE_TEXT.role);
}

export function translateNotificationType(type: string | undefined | null): string {
  return resolveLabel(NOTIFICATION_TYPE_LABELS, type, SAFE_TEXT.notificationType);
}

export function translateTimelineEventType(type: string | undefined | null): string {
  return resolveLabel(TIMELINE_EVENT_TYPE_LABELS, type, SAFE_TEXT.timelineEvent);
}

export function getConsultationPriorityChip(priority: string | undefined | null) {
  const key = normalizeEnumKey(priority);
  const colors = key ? PRIORITY_CHIP_COLORS[key] : undefined;

  return {
    label: translateConsultationPriority(priority),
    bg: colors?.bg ?? DEFAULT_PRIORITY_CHIP_COLORS.bg,
    text: colors?.text ?? DEFAULT_PRIORITY_CHIP_COLORS.text,
  };
}

export function getConsultationStatusChip(status: string | undefined | null) {
  const key = normalizeEnumKey(status);
  const colors = key ? STATUS_CHIP_COLORS[key] : undefined;

  return {
    label: translateConsultationStatus(status),
    bg: colors?.bg ?? DEFAULT_STATUS_CHIP_COLORS.bg,
    text: colors?.text ?? DEFAULT_STATUS_CHIP_COLORS.text,
  };
}

export function translateSystemMessage(
  message: string | undefined | null,
  fallback: string = SAFE_TEXT.default,
): string {
  if (!message?.trim()) {
    return fallback;
  }

  let translated = message.trim();

  translated = translated
    .replace(/Tu verificacion como doctor fue/gi, 'Tu verificación como médico fue')
    .replace(/\bMedico\b/gi, 'Médico')
    .replace(/Revision clinica/gi, 'Revisión clínica')
    .replace(/Resumen clinico/gi, 'Resumen clínico')
    .replace(/En atencion/gi, 'En atención')
    .replace(/Odontologia/gi, 'Odontología')
    .replace(/Aun no hay/gi, 'Aún no hay');

  translated = replaceEnumTokens(translated);
  translated = translated.replace(/\s{2,}/g, ' ').trim();

  return translated || fallback;
}

export function translateTimelineEventSubtitle(subtitle: string | undefined | null): string {
  return translateSystemMessage(subtitle, SAFE_TEXT.timelineDetail);
}
