export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';
export type UserGender = 'MALE' | 'FEMALE' | 'OTHER';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  DOCTOR: 'Doctor',
  PATIENT: 'Paciente',
};

export const USER_GENDER_LABELS: Record<UserGender, string> = {
  FEMALE: 'Femenino',
  MALE: 'Masculino',
  OTHER: 'Otro',
};
