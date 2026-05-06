import { triageService } from '@/src/features/patient-triage/triage-service';
import { apiClient } from '@/src/services/api/client';

jest.mock('@/src/services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

const baseSessionResponse = {
  sessionId: 's1',
  specialty: 'GENERAL_MEDICINE',
  status: 'IN_PROGRESS',
  questions: [],
  totalQuestions: 5,
  answeredCount: 1,
  remainingQuestions: 4,
  progressPercent: 20,
  nextQuestionId: null,
  isComplete: false,
};

const saveAnswersResponse = {
  sessionId: 's1',
  answersCount: 1,
  isComplete: false,
  totalQuestions: 5,
  answeredCount: 2,
  remainingQuestions: 3,
  progressPercent: 40,
  nextQuestionId: 'q3',
};

const analyzeResponse = {
  sessionId: 's1',
  consultationId: 'c1',
  priority: 'HIGH',
  redFlags: [
    { code: 'RF1', severity: 'CRITICAL', evidence: 'Dolor intenso' },
  ],
  message: 'Atencion prioritaria',
  highPriorityAlert: true,
};

describe('triageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a triage session', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: baseSessionResponse });

    const result = await triageService.createSession('GENERAL_MEDICINE');

    expect(apiClient.post).toHaveBeenCalledWith('/triage/sessions', {
      specialty: 'GENERAL_MEDICINE',
    });
    expect(result).toEqual(baseSessionResponse);
  });

  it('lists active sessions with optional specialty', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { items: [], total: 0 },
    });

    await triageService.getActiveSessions('ODONTOLOGY');

    expect(apiClient.get).toHaveBeenCalledWith('/triage/sessions/active', {
      params: { specialty: 'ODONTOLOGY' },
    });
  });

  it('lists active sessions without specialty filters', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { items: [], total: 0 },
    });

    await triageService.getActiveSessions();

    expect(apiClient.get).toHaveBeenCalledWith('/triage/sessions/active', {
      params: {},
    });
  });

  it('fetches session detail', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: baseSessionResponse });

    const result = await triageService.getSessionDetail('s1');

    expect(apiClient.get).toHaveBeenCalledWith('/triage/sessions/s1');
    expect(result.sessionId).toBe('s1');
  });

  it('saves answers', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: saveAnswersResponse });

    const result = await triageService.saveAnswers('s1', [
      { questionId: 'q2', answerValue: 'YES' },
    ]);

    expect(apiClient.post).toHaveBeenCalledWith('/triage/sessions/s1/answers', {
      answers: [{ questionId: 'q2', answerValue: 'YES' }],
    });
    expect(result).toEqual(saveAnswersResponse);
  });

  it('analyzes a session', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: analyzeResponse });

    const result = await triageService.analyzeSession('s1');

    expect(apiClient.post).toHaveBeenCalledWith('/triage/sessions/s1/analyze');
    expect(result.consultationId).toBe('c1');
  });

  it('cancels a session', async () => {
    (apiClient.patch as jest.Mock).mockResolvedValue({
      data: { sessionId: 's1', status: 'CANCELED' },
    });

    const result = await triageService.cancelSession('s1');

    expect(apiClient.patch).toHaveBeenCalledWith('/triage/sessions/s1/cancel');
    expect(result).toEqual({ sessionId: 's1', status: 'CANCELED' });
  });
});
