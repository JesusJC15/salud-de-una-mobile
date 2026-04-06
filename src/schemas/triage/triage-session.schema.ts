import { z } from 'zod';

import { triageQuestionRawSchema, triageQuestionSchema } from '@/src/schemas/triage/triage-question.schema';
import { triageResultRawSchema, triageResultSchema } from '@/src/schemas/triage/triage-result.schema';
import { TriageQuestion, TriageSession, TriageSpecialty } from '@/src/types/triage';

export const triageSpecialtySchema = z.enum(['GENERAL_MEDICINE', 'DENTISTRY']);

export const triageSessionRawSchema = z
  .object({
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
    step: z.coerce.number().int().optional(),
    totalQuestions: z.coerce.number().int().optional(),
    totalSteps: z.coerce.number().int().optional(),
  })
  .passthrough();

function findCurrentQuestion(
  questions: TriageQuestion[],
  currentQuestionId: string | null,
  currentStep: number,
  isComplete: boolean
) {
  if (currentQuestionId) {
    const byId = questions.find((question) => question.id === currentQuestionId);

    if (byId) {
      return byId;
    }
  }

  if (isComplete || questions.length === 0) {
    return null;
  }

  const byStep = questions[currentStep - 1];

  return byStep ?? questions[0] ?? null;
}

export const triageSessionSchema = triageSessionRawSchema.transform<TriageSession>((value) => {
  const id = value.id ?? value.sessionId ?? '';
  const specialty = value.specialty as TriageSpecialty;
  const questions = value.questions.map((question) => triageQuestionSchema.parse(question));
  const isComplete = value.isComplete ?? false;
  const totalSteps = Math.max(value.totalSteps ?? value.totalQuestions ?? questions.length, 0);

  const resolvedCurrentQuestion = value.currentQuestion
    ? triageQuestionSchema.parse(value.currentQuestion)
    : null;

  const questionIndex = value.questionIndex != null ? value.questionIndex + 1 : undefined;
  const currentStepFromPayload = value.currentStep ?? value.step ?? questionIndex;

  const currentQuestion = resolvedCurrentQuestion
    ?? findCurrentQuestion(questions, value.currentQuestionId ?? null, currentStepFromPayload ?? 1, isComplete);

  const indexFromQuestion = currentQuestion ? questions.findIndex((question) => question.id === currentQuestion.id) + 1 : 0;
  const computedStep = currentStepFromPayload ?? indexFromQuestion;

  const currentStep = totalSteps === 0 ? 0 : Math.min(Math.max(computedStep || 1, 1), totalSteps);

  const parsedResult = value.result ? triageResultSchema.parse(value.result) : null;

  return {
    currentQuestion,
    currentQuestionId: currentQuestion?.id ?? value.currentQuestionId ?? null,
    currentStep,
    id,
    isComplete,
    nextQuestionId: value.nextQuestionId ?? null,
    questions,
    result: parsedResult
      ? {
          ...parsedResult,
          sessionId: parsedResult.sessionId || id,
        }
      : null,
    specialty,
    totalSteps,
  };
});
