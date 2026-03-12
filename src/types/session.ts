export type UserRole = 'PATIENT';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

export interface RefreshSessionResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}