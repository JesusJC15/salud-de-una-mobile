import type { UserRole } from '@/src/types/enums';

export type EntityId = string;
export type IsoDateString = string;
export type TokenType = 'access' | 'refresh';

export interface JwtPayload {
  sub: EntityId;
  role: UserRole;
  email: string;
  tokenType: TokenType;
  jti?: string;
  iat?: number;
  exp?: number;
}
