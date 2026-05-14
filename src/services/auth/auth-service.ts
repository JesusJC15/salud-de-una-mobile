import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from '@/src/schemas/auth';
import { apiClient } from '@/src/services/api/client';
import { UpdatePatientProfileInput, UserProfile } from '@/src/types/user';
import { AuthSession, LogoutResponse, RefreshSessionResponse } from '@/src/types/session';

type AuthMeResponse = {
  user: {
    id: string;
    email: string;
    role: AuthSession['user']['role'];
    isActive: boolean;
  };
};

export const authService = {
  async registerPatient(input: RegisterInput) {
    const payload = registerSchema.parse(input);
    const response = await apiClient.post<UserProfile>('/auth/patient/register', payload);

    return response.data;
  },

  async loginPatient(input: LoginInput) {
    const payload = loginSchema.parse(input);
    const response = await apiClient.post<AuthSession>('/auth/patient/login', payload);

    return response.data;
  },

  async refreshSession(refreshToken: string) {
    const response = await apiClient.post<RefreshSessionResponse>(
      '/auth/refresh',
      { refreshToken },
      { skipAuthRefresh: true }
    );

    return response.data;
  },

  async logout(refreshToken?: string | null) {
    const response = await apiClient.post<LogoutResponse>(
      '/auth/logout',
      { refreshToken },
      { skipAuthRefresh: true }
    );

    return response.data;
  },

  async getCurrentPatient() {
    const response = await apiClient.get<UserProfile>('/patients/me');

    return response.data;
  },

  async updateCurrentPatient(input: UpdatePatientProfileInput) {
    const payload = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined && value !== null)
    ) as UpdatePatientProfileInput;

    const response = await apiClient.put<UserProfile>('/patients/me', payload);

    return response.data;
  },

  async getCurrentAuthUser() {
    const response = await apiClient.get<AuthMeResponse>('/auth/me');

    return response.data;
  },

  async exportPatientData() {
    const response = await apiClient.get<Record<string, unknown>>('/patients/me/data-export');
    return response.data;
  },

  async anonymizeAccount() {
    const response = await apiClient.delete<{ anonymized: boolean; accountState: string }>(
      '/patients/me/account',
      { skipAuthRefresh: true },
    );
    return response.data;
  },
};