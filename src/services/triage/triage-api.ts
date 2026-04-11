import { z } from 'zod';

import {
  normalizeCreateTriageSessionInput,
  normalizeSubmitTriageAnswerPayload,
  submitTriageAnswerResponseSchema,
} from '@/src/schemas/triage/triage-answer.schema';
import { triageResultSchema } from '@/src/schemas/triage/triage-result.schema';
import {
  cancelTriageSessionResponseSchema,
  triageActiveSessionListSchema,
  triageSessionSchema,
  triageSessionStatusSchema,
  triageSpecialtySchema,
} from '@/src/schemas/triage/triage-session.schema';
import { ApiError } from '@/src/services/api/api-error';
import { apiClient } from '@/src/services/api/client';
import {
  CancelTriageSessionResponse,
  CreateTriageSessionInput,
  SubmitTriageAnswerResponse,
  TriageAnswerSubmissionInput,
  TriageActiveSessionList,
  TriageResult,
  TriageSession,
  TriageSpecialty,
} from '@/src/types/triage';

const triageSessionConflictResponseSchema = z
  .object({
    errorCode: z.string().trim(),
    existingSessionId: z.string().trim().min(1),
    specialty: triageSpecialtySchema,
    status: triageSessionStatusSchema,
  })
  .catchall(z.unknown());

const createTriageSessionFallbackSchema = z
  .object({
    answeredCount: z.coerce.number().int().optional(),
    id: z.string().trim().optional(),
    isComplete: z.boolean().optional(),
    nextQuestionId: z.string().trim().nullish(),
    sessionId: z.string().trim().optional(),
    specialty: triageSpecialtySchema.optional(),
    status: triageSessionStatusSchema.optional(),
    totalQuestions: z.coerce.number().int().optional(),
    totalSteps: z.coerce.number().int().optional(),
  })
  .catchall(z.unknown())
  .refine((value) => Boolean(value.id ?? value.sessionId), {
    message: 'Create triage session response does not include session id.',
    path: ['sessionId'],
  });

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
      answeredCount: 0,
      currentQuestionId: parsedSession.data.currentQuestionId,
      isComplete: parsedSession.data.isComplete,
      nextQuestionId: parsedSession.data.nextQuestionId,
      progressPercent: 0,
      remainingQuestions: 0,
      totalQuestions: parsedSession.data.totalSteps,
    };
  }

  throw new ApiError('No fue posible interpretar la respuesta del envio de respuestas de triage.', {
    details: {
      endpoint: `/triage/sessions/${sessionId}/answers`,
    },
  });
}

function normalizeCreateSessionResponse(payload: unknown, input: CreateTriageSessionInput) {
  const parsedSession = triageSessionSchema.safeParse(payload);

  if (parsedSession.success) {
    return ensureSessionId(parsedSession.data, '/triage/sessions') satisfies TriageSession;
  }

  const parsedFallback = createTriageSessionFallbackSchema.safeParse(payload);

  if (!parsedFallback.success) {
    throw new ApiError('La respuesta del servicio de triage no tiene el formato esperado.', {
      details: {
        endpoint: '/triage/sessions',
        issues: parsedSession.error.issues,
      },
    });
  }

  const id = (parsedFallback.data.id ?? parsedFallback.data.sessionId ?? '').trim();
  const totalSteps = Math.max(parsedFallback.data.totalSteps ?? parsedFallback.data.totalQuestions ?? 0, 0);
  const answeredCount = parsedFallback.data.answeredCount ?? 0;
  const isComplete = parsedFallback.data.isComplete ?? false;
  let currentStep = 0;

  if (totalSteps > 0) {
    currentStep = Math.min(Math.max(answeredCount + (isComplete ? 0 : 1), 1), totalSteps);
  }

  return {
    createdAt: null,
    currentQuestion: null,
    currentQuestionId: null,
    currentStep,
    id,
    isComplete,
    nextQuestionId: parsedFallback.data.nextQuestionId ?? null,
    questions: [],
    result: null,
    specialty: parsedFallback.data.specialty ?? input.specialty,
    status: (parsedFallback.data.status ?? 'IN_PROGRESS'),
    totalSteps,
    updatedAt: null,
  } satisfies TriageSession;
}

export function getExistingTriageSessionIdFromError(error: unknown) {
  const apiError = ApiError.fromUnknown(error);
  const details = apiError.details as { payload?: unknown } | undefined;
  const parsed = triageSessionConflictResponseSchema.safeParse(details?.payload);

  if (!parsed.success) {
    return null;
  }

  if (parsed.data.errorCode !== 'TRIAGE_SESSION_IN_PROGRESS') {
    return null;
  }

  return parsed.data.existingSessionId;
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

    return normalizeCreateSessionResponse(response.data, input);
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

  async getActiveTriageSessions(specialty?: TriageSpecialty) {
    const endpoint = specialty
      ? `/triage/sessions/active?specialty=${specialty}`
      : '/triage/sessions/active';

    const response = await apiClient.get('/triage/sessions/active', {
      params: specialty ? { specialty } : undefined,
    });

    return parseOrThrow(triageActiveSessionListSchema, response.data, endpoint) satisfies TriageActiveSessionList;
  },

  async cancelTriageSession(sessionId: string) {
    validateSessionId(sessionId);

    const response = await apiClient.patch(`/triage/sessions/${sessionId}/cancel`);

    return parseOrThrow(
      cancelTriageSessionResponseSchema,
      response.data,
      `/triage/sessions/${sessionId}/cancel`
    ) satisfies CancelTriageSessionResponse;
  },

  async submitTriageAnswer(sessionId: string, input: TriageAnswerSubmissionInput) {
    validateSessionId(sessionId);

    const payload = normalizeSubmitTriageAnswerPayload(input);
    const response = await apiClient.post(`/triage/sessions/${sessionId}/answers`, payload);

    return normalizeSubmitResponse(response.data, sessionId) satisfies SubmitTriageAnswerResponse;
  },
};
