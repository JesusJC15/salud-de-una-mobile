import { z } from 'zod';

import { triageSpecialtySchema } from '@/src/schemas/triage/triage-session.schema';
import {
  CreateTriageSessionInput,
  SubmitTriageAnswerPayload,
  SubmitTriageAnswerResponse,
  TriageAnswerSubmissionInput,
} from '@/src/types/triage';

const singleChoiceAnswerSchema = z.object({
  questionId: z.string().trim().min(1),
  selectedOptionId: z.string().trim().min(1),
  type: z.literal('SINGLE_CHOICE'),
});

const multiChoiceAnswerSchema = z.object({
  questionId: z.string().trim().min(1),
  selectedOptionIds: z.array(z.string().trim().min(1)).min(1),
  type: z.literal('MULTI_CHOICE'),
});

const numericScaleAnswerSchema = z.object({
  questionId: z.string().trim().min(1),
  type: z.literal('NUMERIC_SCALE'),
  value: z.coerce.number(),
});

export const triageAnswerSubmissionSchema = z.discriminatedUnion('type', [
  singleChoiceAnswerSchema,
  multiChoiceAnswerSchema,
  numericScaleAnswerSchema,
]);

export const createTriageSessionInputSchema = z.object({
  specialty: triageSpecialtySchema,
});

export const submitTriageAnswerPayloadSchema = triageAnswerSubmissionSchema.transform<SubmitTriageAnswerPayload>((value) => {
  if (value.type === 'SINGLE_CHOICE') {
    return {
      answers: [
        {
          answerValue: value.selectedOptionId,
          questionId: value.questionId,
        },
      ],
    };
  }

  if (value.type === 'MULTI_CHOICE') {
    return {
      answers: [
        {
          answerValue: value.selectedOptionIds,
          questionId: value.questionId,
        },
      ],
    };
  }

  return {
    answers: [
      {
        answerValue: value.value,
        questionId: value.questionId,
      },
    ],
  };
});

const submitTriageAnswerResponseRawSchema = z
  .object({
    answeredCount: z.coerce.number().int().optional(),
    currentQuestionId: z.string().trim().nullish(),
    isComplete: z.boolean().optional(),
    nextQuestionId: z.string().trim().nullish(),
    progressPercent: z.coerce.number().optional(),
    remainingQuestions: z.coerce.number().int().optional(),
    totalQuestions: z.coerce.number().int().optional(),
  })
  .catchall(z.unknown());

export const submitTriageAnswerResponseSchema = submitTriageAnswerResponseRawSchema.transform<SubmitTriageAnswerResponse>((value) => ({
  answeredCount: value.answeredCount ?? 0,
  currentQuestionId: value.currentQuestionId ?? null,
  isComplete: value.isComplete ?? false,
  nextQuestionId: value.nextQuestionId ?? null,
  progressPercent: value.progressPercent ?? 0,
  remainingQuestions: value.remainingQuestions ?? 0,
  totalQuestions: value.totalQuestions ?? 0,
}));

export function normalizeCreateTriageSessionInput(input: CreateTriageSessionInput) {
  return createTriageSessionInputSchema.parse(input);
}

export function normalizeSubmitTriageAnswerPayload(input: TriageAnswerSubmissionInput) {
  return submitTriageAnswerPayloadSchema.parse(input);
}
