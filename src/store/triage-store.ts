import { create } from 'zustand';
import type { TriageSpecialty } from '@/src/schemas/triage';
import {
  persistConsultationId,
  readStoredConsultationId,
} from '@/src/services/storage/triage-storage';

type TriageState = {
  activeSessionId: string | null;
  specialty: TriageSpecialty | null;
  consultationId: string | null;
  setActiveSession: (sessionId: string, specialty: TriageSpecialty) => void;
  setConsultationId: (id: string | null) => void;
  clearTriage: () => void;
  hydrate: () => Promise<void>;
};

export const useTriageStore = create<TriageState>((set) => ({
  activeSessionId: null,
  specialty: null,
  consultationId: null,

  setActiveSession: (sessionId, specialty) =>
    set({ activeSessionId: sessionId, specialty }),

  setConsultationId: (id) => {
    void persistConsultationId(id);
    set({ consultationId: id });
  },

  clearTriage: () => {
    void persistConsultationId(null);
    set({ activeSessionId: null, specialty: null, consultationId: null });
  },

  hydrate: async () => {
    try {
      const storedId = await readStoredConsultationId();
      if (storedId) {
        set({ consultationId: storedId });
      }
    } catch {
      // Storage unreadable — start fresh
    }
  },
}));
