import type { EntityId, IsoDateString } from '@/src/types/common';
import type { UserGender, UserRole } from '@/src/types/enums';

export type { UserGender } from '@/src/types/enums';

export interface UserProfile {
  id: EntityId;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  birthDate?: IsoDateString | null;
  gender?: UserGender;
  heightCm?: number | null;
  weightKg?: number | null;
  bmi?: number | null;
  phone?: string | null;
  isActive?: boolean;
  createdAt?: IsoDateString | null;
  updatedAt?: IsoDateString | null;
}

export interface UpdatePatientProfileInput {
  firstName?: string;
  lastName?: string;
  birthDate?: IsoDateString;
  gender?: UserGender;
  heightCm?: number;
  weightKg?: number;
  currentPassword?: string;
  newPassword?: string;
}
