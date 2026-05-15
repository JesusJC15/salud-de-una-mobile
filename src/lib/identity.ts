import {
  USER_GENDER_LABELS,
  USER_ROLE_LABELS,
  type UserGender,
  type UserRole,
} from '@/src/types/enums';
import { UserProfile } from '@/src/types/user';

import { translateEnumValue } from '@/src/lib/enum-labels';

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const values = [firstName, lastName]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  if (values.length === 0) {
    return 'SD';
  }

  return values
    .slice(0, 2)
    .map((value) => value.charAt(0).toUpperCase())
    .join('');
}

export function translateUserRole(role?: UserRole | null): string {
  return translateEnumValue(USER_ROLE_LABELS, role, { fallback: 'Rol no disponible' });
}

export function translateUserGender(gender?: UserGender | null): string {
  return translateEnumValue(USER_GENDER_LABELS, gender, { fallback: 'No especificado' });
}

export function getProfileDisplayName(profile?: UserProfile | null): string {
  if (!profile) {
    return 'Paciente';
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  return fullName || profile.email;
}
