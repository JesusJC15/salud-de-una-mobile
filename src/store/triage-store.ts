import { create } from 'zustand';
import type { TriageSpecialty } from '@/src/schemas/triage';

type TriageState = {
  activeSessionId: string | null;
  specialty: TriageSpecialty | null;
  consultationId: string | null;
  setActiveSession: (sessionId: string, specialty: TriageSpecialty) => void;
  setConsultationId: (id: string) => void;
  clearTriage: () => void;
};

export const useTriageStore = create<TriageState>((set) => ({
  activeSessionId: null,
  specialty: null,
  consultationId: null,

  setActiveSession: (sessionId, specialty) =>
    set({ activeSessionId: sessionId, specialty }),

  setConsultationId: (id) => set({ consultationId: id }),

  clearTriage: () =>
    set({ activeSessionId: null, specialty: null, consultationId: null }),
}));
