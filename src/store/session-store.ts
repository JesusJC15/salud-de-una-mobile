import { create } from 'zustand';

import { clearStoredSession, persistSession, readStoredSession } from '@/src/services/auth/token-storage';
import { AuthSession } from '@/src/types/session';
import { UserProfile } from '@/src/types/user';

export type SessionStatus = 'hydrating' | 'anonymous' | 'authenticated';

export type PersistedAuthState = {
  session: AuthSession | null;
  profile: UserProfile | null;
};

type SessionState = {
  status: SessionStatus;
  session: AuthSession | null;
  profile: UserProfile | null;
  hydrate: () => Promise<void>;
  setSession: (session: AuthSession, profile: UserProfile | null) => Promise<void>;
  setProfile: (profile: UserProfile | null) => void;
  clearSession: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set) => ({
  status: 'hydrating',
  session: null,
  profile: null,
  hydrate: async () => {
    const storedAuthState = await readStoredSession();

    set({
      session: storedAuthState?.session ?? null,
      profile: storedAuthState?.profile ?? null,
      status: storedAuthState?.session ? 'authenticated' : 'anonymous',
    });
  },
  setSession: async (session, profile) => {
    await persistSession({ session, profile });

    set({
      session,
      profile,
      status: 'authenticated',
    });
  },
  setProfile: (profile) => {
    set((state) => ({
      ...state,
      profile,
    }));
  },
  clearSession: async () => {
    await clearStoredSession();

    set({
      session: null,
      profile: null,
      status: 'anonymous',
    });
  },
}));