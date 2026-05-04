import type { EntityId, IsoDateString } from '@/src/types/common';
import type { UserRole } from '@/src/types/enums';

export type { UserRole } from '@/src/types/enums';

export interface AuthenticatedUser {
  id: EntityId;
  email: string;
  role: UserRole;
  isActive?: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  refreshSessionId?: string;
  user: AuthenticatedUser;
  authMethod?: 'auth0' | 'legacy';
}

export type RefreshSessionResponse = AuthSession;

export interface LogoutResponse {
  message: string;
}

export interface RefreshSession {
  id?: EntityId;
  sessionId: string;
  userId: EntityId;
  email: string;
  role: UserRole;
  tokenHash: string;
  expiresAt: IsoDateString;
  revokedAt?: IsoDateString;
  revokedReason?: string;
  createdAt?: IsoDateString | null;
  updatedAt?: IsoDateString | null;
}