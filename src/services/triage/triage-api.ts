import { z } from 'zod';

import {
  normalizeCreateTriageSessionInput,
  normalizeSubmitTriageAnswerPayload,
  submitTriageAnswerResponseSchema,
} from '@/src/schemas/triage/triage-answer.schema';
import { triageResultSchema } from '@/src/schemas/triage/triage-result.schema';
import { triageSessionSchema } from '@/src/schemas/triage/triage-session.schema';
import { ApiError } from '@/src/services/api/api-error';
import { apiClient } from '@/src/services/api/client';
import {
  CreateTriageSessionInput,
  SubmitTriageAnswerResponse,
  TriageAnswerSubmissionInput,
  TriageResult,
  TriageSession,
} from '@/src/types/triage';

function parseOrThrow<T>(schema: z.ZodType<T>, payload: unknown, endpoint: string): T {
  const parsed = schema.safeParse(payload);

  if (parsed.success) {
    return parsed.data;
  }

  throw new ApiError('La respuesta del servicio de triage no tiene el formato esperado.', {
    details: {
      endpoint,
      issues: parsed.error.issues,
    },
  });
}

function validateSessionId(sessionId: string) {
  if (!sessionId.trim()) {
    throw new ApiError('No se encontro el identificador de la sesion de triage.');
  }
}

function ensureSessionId(session: TriageSession, endpoint: string) {
  if (session.id.trim()) {
    return session;
  }

  throw new ApiError('La sesion de triage no incluye un id valido.', {
    details: {
      endpoint,
    },
  });
}

function normalizeSubmitResponse(payload: unknown, sessionId: string): SubmitTriageAnswerResponse {
  const parsedSubmitResponse = submitTriageAnswerResponseSchema.safeParse(payload);

  if (parsedSubmitResponse.success) {
    return parsedSubmitResponse.data;
  }

  const parsedSession = triageSessionSchema.safeParse(payload);

  if (parsedSession.success) {
    return {
      currentQuestionId: parsedSession.data.currentQuestionId,
      isComplete: parsedSession.data.isComplete,
      nextQuestionId: parsedSession.data.nextQuestionId,
    };
  }

  throw new ApiError('No fue posible interpretar la respuesta del envio de respuestas de triage.', {
    details: {
      endpoint: `/triage/sessions/${sessionId}/answers`,
    },
  });
}

export const triageApiService = {
  async analyzeTriageSession(sessionId: string) {
    validateSessionId(sessionId);

    const response = await apiClient.post(`/triage/sessions/${sessionId}/analyze`);
    const parsed = parseOrThrow(triageResultSchema, response.data, `/triage/sessions/${sessionId}/analyze`);

    return {
      ...parsed,
      sessionId: parsed.sessionId || sessionId,
    } satisfies TriageResult;
  },

  async createTriageSession(input: CreateTriageSessionInput) {
    const payload = normalizeCreateTriageSessionInput(input);
    const response = await apiClient.post('/triage/sessions', payload);
    const session = parseOrThrow(triageSessionSchema, response.data, '/triage/sessions');

    return ensureSessionId(session, '/triage/sessions') satisfies TriageSession;
  },

  async getTriageResult(sessionId: string) {
    validateSessionId(sessionId);

    const response = await apiClient.get(`/triage/sessions/${sessionId}/result`);
    const parsed = parseOrThrow(triageResultSchema, response.data, `/triage/sessions/${sessionId}/result`);

    return {
      ...parsed,
      sessionId: parsed.sessionId || sessionId,
    } satisfies TriageResult;
  },

  async getTriageSession(sessionId: string) {
    validateSessionId(sessionId);

    const response = await apiClient.get(`/triage/sessions/${sessionId}`);
    const session = parseOrThrow(triageSessionSchema, response.data, `/triage/sessions/${sessionId}`);

    return ensureSessionId(session, `/triage/sessions/${sessionId}`) satisfies TriageSession;
  },

  async submitTriageAnswer(sessionId: string, input: TriageAnswerSubmissionInput) {
    validateSessionId(sessionId);

    const payload = normalizeSubmitTriageAnswerPayload(input);
    const response = await apiClient.post(`/triage/sessions/${sessionId}/answers`, payload);

    return normalizeSubmitResponse(response.data, sessionId) satisfies SubmitTriageAnswerResponse;
  },
};
