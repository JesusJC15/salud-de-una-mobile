import { UserRole } from '@/src/types/session';

export type UserGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  birthDate?: string;
  gender?: UserGender;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}