import { z } from 'zod';

import { TriageQuestion, TriageQuestionOption } from '@/src/types/triage';

export const triageQuestionTypeSchema = z.enum(['SINGLE_CHOICE', 'MULTI_CHOICE', 'NUMERIC_SCALE']);

export const triageQuestionOptionRawSchema = z
  .object({
    description: z.string().trim().nullish(),
    id: z.string().trim().min(1),
    label: z.string().trim().optional(),
    text: z.string().trim().optional(),
    title: z.string().trim().optional(),
  })
  .passthrough();

export const triageQuestionOptionSchema = triageQuestionOptionRawSchema.transform<TriageQuestionOption>((value) => ({
  description: value.description ?? null,
  id: value.id,
  label: value.label ?? value.title ?? value.text ?? value.id,
}));

export const triageQuestionRawSchema = z
  .object({
    currentValue: z.coerce.number().int().optional(),
    description: z.string().trim().nullish(),
    id: z.string().trim().min(1),
    max: z.coerce.number().int().optional(),
    maxValue: z.coerce.number().int().optional(),
    min: z.coerce.number().int().optional(),
    minValue: z.coerce.number().int().optional(),
    options: z.array(triageQuestionOptionRawSchema).default([]),
    question: z.string().trim().optional(),
    step: z.coerce.number().int().optional(),
    text: z.string().trim().optional(),
    title: z.string().trim().optional(),
    type: triageQuestionTypeSchema,
  })
  .passthrough();

export const triageQuestionSchema = triageQuestionRawSchema.transform<TriageQuestion>((value) => {
  const minValue = value.minValue ?? value.min ?? 1;
  const maxValue = value.maxValue ?? value.max ?? 10;
  const step = value.step ?? 1;

  return {
    description: value.description ?? null,
    id: value.id,
    maxValue: maxValue >= minValue ? maxValue : minValue,
    minValue,
    options: value.options.map((option) => triageQuestionOptionSchema.parse(option)),
    step: step > 0 ? step : 1,
    title: value.title ?? value.question ?? value.text ?? 'Pregunta sin titulo',
    type: value.type,
  };
});

export const triageQuestionListSchema = z.array(triageQuestionSchema);
