import { apiClient } from '@/src/services/api/client';
import {
  activeSessionsResponseSchema,
  analyzeSessionResponseSchema,
  createSessionResponseSchema,
  saveAnswersResponseSchema,
  sessionDetailResponseSchema,
  type TriageSpecialty,
} from '@/src/schemas/triage';

export type AnswerValue = string | boolean | number | string[];

export const triageService = {
  async createSession(specialty: TriageSpecialty) {
    const res = await apiClient.post('/triage/sessions', { specialty });
    return createSessionResponseSchema.parse(res.data);
  },

  async getActiveSessions(specialty?: TriageSpecialty) {
    const params = specialty ? { specialty } : {};
    const res = await apiClient.get('/triage/sessions/active', { params });
    return activeSessionsResponseSchema.parse(res.data);
  },

  async getSessionDetail(sessionId: string) {
    const res = await apiClient.get(`/triage/sessions/${sessionId}`);
    return sessionDetailResponseSchema.parse(res.data);
  },

  async saveAnswers(
    sessionId: string,
    answers: { questionId: string; answerValue: AnswerValue }[],
  ) {
    const res = await apiClient.post(`/triage/sessions/${sessionId}/answers`, {
      answers,
    });
    return saveAnswersResponseSchema.parse(res.data);
  },

  async analyzeSession(sessionId: string) {
    const res = await apiClient.post(`/triage/sessions/${sessionId}/analyze`);
    return analyzeSessionResponseSchema.parse(res.data);
  },

  async cancelSession(sessionId: string) {
    const res = await apiClient.patch(`/triage/sessions/${sessionId}/cancel`);
    return res.data as { sessionId: string; status: string };
  },
};
