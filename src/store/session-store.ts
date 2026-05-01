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
  markHydrated: () => void;
  clearSession: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set) => ({
  status: 'hydrating',
  session: null,
  profile: null,
  hydrate: async () => {
    try {
      const storedAuthState = await readStoredSession();
      set({
        session: storedAuthState?.session ?? null,
        profile: storedAuthState?.profile ?? null,
        status: storedAuthState?.session ? 'authenticated' : 'anonymous',
      });
    } catch {
      // Corrupted or unreadable stored session — clear and start fresh
      await clearStoredSession();
      set({ session: null, profile: null, status: 'anonymous' });
    }
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
    void persistSession({
      profile,
      session: useSessionStore.getState().session,
    });

    set((state) => ({
      ...state,
      profile,
    }));
  },
  markHydrated: () => {
    set((state) => ({
      ...state,
      status: state.session ? 'authenticated' : 'anonymous',
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