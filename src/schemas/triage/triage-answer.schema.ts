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
      questionId: value.questionId,
      selectedOptionId: value.selectedOptionId,
    };
  }

  if (value.type === 'MULTI_CHOICE') {
    return {
      questionId: value.questionId,
      selectedOptionIds: value.selectedOptionIds,
    };
  }

  return {
    numericValue: value.value,
    questionId: value.questionId,
  };
});

const submitTriageAnswerResponseRawSchema = z
  .object({
    currentQuestionId: z.string().trim().nullish(),
    isComplete: z.boolean().optional(),
    nextQuestionId: z.string().trim().nullish(),
  })
  .passthrough();

export const submitTriageAnswerResponseSchema = submitTriageAnswerResponseRawSchema.transform<SubmitTriageAnswerResponse>((value) => ({
  currentQuestionId: value.currentQuestionId ?? null,
  isComplete: value.isComplete ?? false,
  nextQuestionId: value.nextQuestionId ?? null,
}));

export function normalizeCreateTriageSessionInput(input: CreateTriageSessionInput) {
  return createTriageSessionInputSchema.parse(input);
}

export function normalizeSubmitTriageAnswerPayload(input: TriageAnswerSubmissionInput) {
  return submitTriageAnswerPayloadSchema.parse(input);
}
