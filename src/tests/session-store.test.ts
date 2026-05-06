import { useSessionStore } from '@/src/store/session-store';
import { clearStoredSession, persistSession, readStoredSession } from '@/src/services/auth/token-storage';
import type { AuthSession } from '@/src/types/session';
import type { UserProfile } from '@/src/types/user';

jest.mock('@/src/services/auth/token-storage', () => ({
  clearStoredSession: jest.fn(),
  persistSession: jest.fn(),
  readStoredSession: jest.fn(),
}));

const sampleSession: AuthSession = {
  accessToken: 'access',
  refreshToken: 'refresh',
  user: {
    id: 'u1',
    email: 'patient@example.com',
    role: 'PATIENT',
    isActive: true,
  },
};

const sampleProfile: UserProfile = {
  id: 'u1',
  firstName: 'Ana',
  lastName: 'Gomez',
  email: 'patient@example.com',
  role: 'PATIENT',
};

describe('useSessionStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSessionStore.setState({
      status: 'hydrating',
      session: null,
      profile: null,
    });
  });

  it('hydrates from stored session', async () => {
    (readStoredSession as jest.Mock).mockResolvedValue({
      session: sampleSession,
      profile: sampleProfile,
    });

    await useSessionStore.getState().hydrate();

    const state = useSessionStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.session).toEqual(sampleSession);
    expect(state.profile).toEqual(sampleProfile);
  });

  it('clears invalid stored session on hydrate errors', async () => {
    (readStoredSession as jest.Mock).mockRejectedValue(new Error('bad'));

    await useSessionStore.getState().hydrate();

    const state = useSessionStore.getState();
    expect(clearStoredSession).toHaveBeenCalledTimes(1);
    expect(state.status).toBe('anonymous');
  });

  it('persists session when setSession is called', async () => {
    await useSessionStore.getState().setSession(sampleSession, sampleProfile);

    expect(persistSession).toHaveBeenCalledWith({
      session: sampleSession,
      profile: sampleProfile,
    });
    expect(useSessionStore.getState().status).toBe('authenticated');
  });

  it('persists current session when updating profile', () => {
    useSessionStore.setState({
      session: sampleSession,
      status: 'authenticated',
      profile: null,
    });

    useSessionStore.getState().setProfile(sampleProfile);

    expect(persistSession).toHaveBeenCalledWith({
      session: sampleSession,
      profile: sampleProfile,
    });
    expect(useSessionStore.getState().profile).toEqual(sampleProfile);
  });

  it('clears session and profile on clearSession', async () => {
    useSessionStore.setState({
      session: sampleSession,
      profile: sampleProfile,
      status: 'authenticated',
    });

    await useSessionStore.getState().clearSession();

    expect(clearStoredSession).toHaveBeenCalledTimes(1);
    const state = useSessionStore.getState();
    expect(state.session).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.status).toBe('anonymous');
  });
});
