import { z } from 'zod';

import { triageQuestionRawSchema, triageQuestionSchema } from '@/src/schemas/triage/triage-question.schema';
import { triageResultRawSchema, triageResultSchema } from '@/src/schemas/triage/triage-result.schema';
import {
  CancelTriageSessionResponse,
  TriageActiveSession,
  TriageActiveSessionList,
  TriageQuestion,
  TriageSession,
  TriageSessionStatus,
  TriageSpecialty,
} from '@/src/types/triage';

export const triageSpecialtySchema = z.enum(['GENERAL_MEDICINE', 'ODONTOLOGY']);
export const triageSessionStatusSchema = z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELED', 'EXPIRED', 'FAILED']);

const triageIsoDateSchema = z.string().trim().nullish();

export const triageSessionRawSchema = z
  .object({
    answeredCount: z.coerce.number().int().optional(),
    createdAt: triageIsoDateSchema,
    currentQuestion: triageQuestionRawSchema.optional(),
    currentQuestionId: z.string().trim().nullish(),
    currentStep: z.coerce.number().int().optional(),
    id: z.string().trim().optional(),
    isComplete: z.boolean().optional(),
    nextQuestionId: z.string().trim().nullish(),
    questionIndex: z.coerce.number().int().optional(),
    questions: z.array(triageQuestionRawSchema).default([]),
    result: triageResultRawSchema.optional(),
    sessionId: z.string().trim().optional(),
    specialty: triageSpecialtySchema,
    status: triageSessionStatusSchema.optional(),
    step: z.coerce.number().int().optional(),
    totalQuestions: z.coerce.number().int().optional(),
    totalSteps: z.coerce.number().int().optional(),
    updatedAt: triageIsoDateSchema,
  })
  .catchall(z.unknown());

function findCurrentQuestion(
  questions: TriageQuestion[],
  currentQuestionId: string | null,
  nextQuestionId: string | null,
  currentStep: number,
  isComplete: boolean
) {
  if (currentQuestionId) {
    const byId = questions.find((question) => question.id === currentQuestionId);

    if (byId) {
      return byId;
    }
  }

  if (!isComplete && questions.length > 0) {
    const byStep = questions[currentStep - 1];

    if (byStep) {
      return byStep;
    }
  }

  if (nextQuestionId) {
    const byNextId = questions.find((question) => question.id === nextQuestionId);

    if (byNextId) {
      return byNextId;
    }
  }

  if (isComplete || questions.length === 0) {
    return null;
  }

  return questions[0] ?? null;
}

export const triageSessionSchema = triageSessionRawSchema.transform<TriageSession>((value) => {
  const id = value.id ?? value.sessionId ?? '';
  const specialty = value.specialty as TriageSpecialty;
  const status = (value.status ?? 'IN_PROGRESS') as TriageSessionStatus;
  const questions = value.questions.map((question) => triageQuestionSchema.parse(question));
  const isComplete = value.isComplete ?? false;
  const totalSteps = Math.max(value.totalSteps ?? value.totalQuestions ?? questions.length, 0);

  const resolvedCurrentQuestion = value.currentQuestion
    ? triageQuestionSchema.parse(value.currentQuestion)
    : null;

  const questionIndex = value.questionIndex == null ? undefined : value.questionIndex + 1;
  const answeredCount = value.answeredCount;
  let fallbackStepFromAnswers: number | undefined;

  if (answeredCount != null) {
    fallbackStepFromAnswers = Math.max(answeredCount + (isComplete ? 0 : 1), 1);
  }

  const currentStepFromPayload = value.currentStep ?? value.step ?? questionIndex ?? fallbackStepFromAnswers;

  const currentQuestion = resolvedCurrentQuestion
    ?? findCurrentQuestion(
      questions,
      value.currentQuestionId ?? null,
      value.nextQuestionId ?? null,
      currentStepFromPayload ?? 1,
      isComplete
    );

  const indexFromQuestion = currentQuestion ? questions.findIndex((question) => question.id === currentQuestion.id) + 1 : 0;
  const computedStep = currentStepFromPayload ?? indexFromQuestion;

  const currentStep = totalSteps === 0 ? 0 : Math.min(Math.max(computedStep || 1, 1), totalSteps);

  const parsedResult = value.result ? triageResultSchema.parse(value.result) : null;

  return {
    currentQuestion,
    currentQuestionId: currentQuestion?.id ?? value.currentQuestionId ?? value.nextQuestionId ?? null,
    currentStep,
    id,
    isComplete,
    nextQuestionId: value.nextQuestionId ?? null,
    questions,
    status,
    result: parsedResult
      ? {
          ...parsedResult,
          sessionId: parsedResult.sessionId || id,
        }
      : null,
    specialty,
    totalSteps,
    createdAt: value.createdAt ?? null,
    updatedAt: value.updatedAt ?? null,
  };
});

export const triageActiveSessionRawSchema = z
  .object({
    createdAt: triageIsoDateSchema,
    currentQuestionId: z.string().trim().nullish(),
    currentStep: z.coerce.number().int().optional(),
    id: z.string().trim().optional(),
    isComplete: z.boolean().optional(),
    nextQuestionId: z.string().trim().nullish(),
    sessionId: z.string().trim().optional(),
    specialty: triageSpecialtySchema,
    status: triageSessionStatusSchema,
    totalQuestions: z.coerce.number().int().optional(),
    totalSteps: z.coerce.number().int().optional(),
    updatedAt: triageIsoDateSchema,
  })
  .refine((value) => Boolean(value.id ?? value.sessionId), {
    message: 'Active triage session id is required.',
    path: ['id'],
  })
  .catchall(z.unknown());

export const triageActiveSessionSchema = triageActiveSessionRawSchema.transform<TriageActiveSession>((value) => {
  const id = (value.id ?? value.sessionId ?? '').trim();
  const totalSteps = Math.max(value.totalSteps ?? value.totalQuestions ?? 0, 0);
  const currentStepRaw = value.currentStep ?? (totalSteps > 0 ? 1 : 0);
  const currentStep = totalSteps === 0 ? 0 : Math.min(Math.max(currentStepRaw, 1), totalSteps);

  return {
    createdAt: value.createdAt ?? null,
    currentQuestionId: value.currentQuestionId ?? value.nextQuestionId ?? null,
    currentStep,
    id,
    isComplete: value.isComplete ?? false,
    specialty: value.specialty as TriageSpecialty,
    status: value.status as TriageSessionStatus,
    totalSteps,
    updatedAt: value.updatedAt ?? null,
  };
});

export const triageActiveSessionListSchema = z
  .object({
    items: z.array(triageActiveSessionRawSchema).default([]),
    total: z.coerce.number().int().optional(),
  })
  .catchall(z.unknown())
  .transform<TriageActiveSessionList>((value) => {
    const items = value.items.map((item) => triageActiveSessionSchema.parse(item));

    return {
      items,
      total: value.total ?? items.length,
    };
  });

export const cancelTriageSessionResponseSchema = z
  .object({
    canceledAt: triageIsoDateSchema,
    message: z.string().trim().nullish(),
    sessionId: z.string().trim().min(1),
    specialty: triageSpecialtySchema,
    status: triageSessionStatusSchema,
  })
  .catchall(z.unknown())
  .transform<CancelTriageSessionResponse>((value) => ({
    canceledAt: value.canceledAt ?? null,
    message: value.message ?? null,
    sessionId: value.sessionId,
    specialty: value.specialty as TriageSpecialty,
    status: value.status as TriageSessionStatus,
  }));
