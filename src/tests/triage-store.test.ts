import { useTriageStore } from '@/src/store/triage-store';
import { persistConsultationId, readStoredConsultationId } from '@/src/services/storage/triage-storage';

jest.mock('@/src/services/storage/triage-storage', () => ({
  persistConsultationId: jest.fn(),
  readStoredConsultationId: jest.fn(),
}));

describe('useTriageStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTriageStore.setState({
      activeSessionId: null,
      specialty: null,
      consultationId: null,
    });
  });

  it('sets active session data', () => {
    useTriageStore.getState().setActiveSession('s1', 'GENERAL_MEDICINE');

    const state = useTriageStore.getState();
    expect(state.activeSessionId).toBe('s1');
    expect(state.specialty).toBe('GENERAL_MEDICINE');
  });

  it('persists consultation id on setConsultationId', () => {
    useTriageStore.getState().setConsultationId('c1');

    expect(persistConsultationId).toHaveBeenCalledWith('c1');
    expect(useTriageStore.getState().consultationId).toBe('c1');
  });

  it('allows clearing persisted consultation id', () => {
    useTriageStore.getState().setConsultationId(null);

    expect(persistConsultationId).toHaveBeenCalledWith(null);
    expect(useTriageStore.getState().consultationId).toBeNull();
  });

  it('clears triage state and storage', () => {
    useTriageStore.setState({
      activeSessionId: 's1',
      specialty: 'ODONTOLOGY',
      consultationId: 'c1',
    });

    useTriageStore.getState().clearTriage();

    expect(persistConsultationId).toHaveBeenCalledWith(null);
    const state = useTriageStore.getState();
    expect(state.activeSessionId).toBeNull();
    expect(state.specialty).toBeNull();
    expect(state.consultationId).toBeNull();
  });

  it('hydrates consultation id from storage', async () => {
    (readStoredConsultationId as jest.Mock).mockResolvedValue('c1');

    await useTriageStore.getState().hydrate();

    expect(useTriageStore.getState().consultationId).toBe('c1');
  });
});
