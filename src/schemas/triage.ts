import { z } from 'zod';

export const triageSpecialtySchema = z.enum(['GENERAL_MEDICINE', 'ODONTOLOGY']);
export type TriageSpecialty = z.infer<typeof triageSpecialtySchema>;

export const triageQuestionTypeSchema = z.enum([
  'SINGLE_CHOICE',
  'MULTI_CHOICE',
  'NUMERIC_SCALE',
]);
export type TriageQuestionType = z.infer<typeof triageQuestionTypeSchema>;

export const triageQuestionOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
});
export type TriageQuestionOption = z.infer<typeof triageQuestionOptionSchema>;

export const triageQuestionSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  title: z.string(),
  questionText: z.string(),
  description: z.string().optional(),
  type: triageQuestionTypeSchema,
  required: z.boolean().optional(),
  options: z.array(triageQuestionOptionSchema).optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  step: z.number().optional(),
});
export type TriageQuestion = z.infer<typeof triageQuestionSchema>;

export const createSessionResponseSchema = z.object({
  sessionId: z.string(),
  specialty: triageSpecialtySchema,
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELED', 'FAILED', 'EXPIRED']),
  questions: z.array(triageQuestionSchema),
  totalQuestions: z.number(),
  answeredCount: z.number(),
  remainingQuestions: z.number(),
  progressPercent: z.number(),
  nextQuestionId: z.string().nullable(),
  isComplete: z.boolean(),
});
export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;

export const saveAnswersResponseSchema = z.object({
  sessionId: z.string(),
  answersCount: z.number(),
  isComplete: z.boolean(),
  totalQuestions: z.number(),
  answeredCount: z.number(),
  remainingQuestions: z.number(),
  progressPercent: z.number(),
  nextQuestionId: z.string().nullable(),
});
export type SaveAnswersResponse = z.infer<typeof saveAnswersResponseSchema>;

export const redFlagSchema = z.object({
  code: z.string(),
  severity: z.enum(['CRITICAL', 'WARNING', 'INFO']),
  evidence: z.string(),
});

export const analyzeSessionResponseSchema = z.object({
  sessionId: z.string(),
  consultationId: z.string(),
  priority: z.enum(['LOW', 'MODERATE', 'HIGH']),
  redFlags: z.array(redFlagSchema),
  message: z.string(),
  highPriorityAlert: z.boolean(),
  analysisMode: z.enum(['AI_ASSISTED', 'RULE_BASED']).optional(),
  noticeCode: z.string().optional(),
});
export type AnalyzeSessionResponse = z.infer<typeof analyzeSessionResponseSchema>;

export const activeSessionSchema = z.object({
  id: z.string(),
  specialty: triageSpecialtySchema,
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELED', 'FAILED', 'EXPIRED']),
  currentStep: z.number(),
  totalSteps: z.number(),
  currentQuestionId: z.string().nullable(),
  isComplete: z.boolean(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});
export type ActiveSession = z.infer<typeof activeSessionSchema>;

export const activeSessionsResponseSchema = z.object({
  items: z.array(activeSessionSchema),
  total: z.number(),
});
