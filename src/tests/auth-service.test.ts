import { authService } from '@/src/services/auth/auth-service';
import { apiClient } from '@/src/services/api/client';

jest.mock('@/src/services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registerPatient calls /auth/patient/register', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: '1' } });

    await authService.registerPatient({
      email: '  patient@example.com  ',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: 'Abcdef1!',
      birthDate: null,
    });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/patient/register', {
      email: 'patient@example.com',
      firstName: 'Ana',
      lastName: 'Gomez',
      password: 'Abcdef1!',
      birthDate: null,
    });
  });

  it('loginPatient calls /auth/patient/login', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { accessToken: 'a' } });

    await authService.loginPatient({
      email: 'patient@example.com',
      password: 'Abcdef1!',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/patient/login', {
      email: 'patient@example.com',
      password: 'Abcdef1!',
    });
  });

  it('refreshSession calls /auth/refresh with skipAuthRefresh', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { accessToken: 'next' } });

    await authService.refreshSession('refresh-token');

    expect(apiClient.post).toHaveBeenCalledWith(
      '/auth/refresh',
      { refreshToken: 'refresh-token' },
      { skipAuthRefresh: true }
    );
  });

  it('logout calls /auth/logout with skipAuthRefresh', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { message: 'ok' } });

    await authService.logout('refresh-token');

    expect(apiClient.post).toHaveBeenCalledWith(
      '/auth/logout',
      { refreshToken: 'refresh-token' },
      { skipAuthRefresh: true }
    );
  });

  it('getCurrentPatient calls /patients/me', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { id: '1' } });

    await authService.getCurrentPatient();

    expect(apiClient.get).toHaveBeenCalledWith('/patients/me');
  });

  it('updateCurrentPatient calls PUT /patients/me and omits undefined values', async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({ data: { id: '1' } });

    await authService.updateCurrentPatient({
      birthDate: undefined,
      firstName: 'Ana',
      lastName: undefined,
    });

    expect(apiClient.put).toHaveBeenCalledWith('/patients/me', {
      firstName: 'Ana',
    });
  });

  it('getCurrentAuthUser calls /auth/me', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { user: { id: '1' } } });

    await authService.getCurrentAuthUser();

    expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
  });
});
