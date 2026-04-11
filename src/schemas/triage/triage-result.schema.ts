import { z } from 'zod';

import { TriageRedFlag, TriageResult } from '@/src/types/triage';

export const triagePrioritySchema = z.enum(['LOW', 'MODERATE', 'HIGH']);
export const triageAnalysisModeSchema = z.enum(['AI_ASSISTED', 'RULE_BASED']);
export const triageAnalysisNoticeCodeSchema = z.enum([
  'IA_NOT_IMPLEMENTED_RULE_BASED_FALLBACK',
  'IA_TEMPORARILY_UNAVAILABLE_RULE_BASED_FALLBACK',
]);

const triageRedFlagRawSchema = z
  .object({
    description: z.string().trim().nullish(),
    id: z.string().trim().optional(),
    message: z.string().trim().optional(),
    subtitle: z.string().trim().optional(),
    text: z.string().trim().optional(),
    title: z.string().trim().optional(),
  })
  .catchall(z.unknown());

export const triageRedFlagSchema = triageRedFlagRawSchema.transform<TriageRedFlag>((value) => ({
  description: value.description ?? value.subtitle ?? value.message ?? null,
  id: value.id ?? null,
  title: value.title ?? value.text ?? value.message ?? 'Senal de alerta',
}));

export const triageResultRawSchema = z
  .object({
    analyzedAt: z.string().trim().nullish(),
    analysisMode: z.string().trim().nullish(),
    noticeCode: z.string().trim().nullish(),
    priority: triagePrioritySchema,
    redFlags: z.array(triageRedFlagRawSchema).optional(),
    sessionId: z.string().trim().optional(),
    warningSigns: z.array(triageRedFlagRawSchema).optional(),
  })
  .catchall(z.unknown());

export const triageResultSchema = triageResultRawSchema.transform<TriageResult>((value) => {
  const parsedAnalysisMode = triageAnalysisModeSchema.safeParse(value.analysisMode);
  const parsedNoticeCode = triageAnalysisNoticeCodeSchema.safeParse(value.noticeCode);

  return {
    analyzedAt: value.analyzedAt ?? null,
    analysisMode: parsedAnalysisMode.success ? parsedAnalysisMode.data : null,
    noticeCode: parsedNoticeCode.success ? parsedNoticeCode.data : null,
    priority: value.priority,
    redFlags: (value.redFlags ?? value.warningSigns ?? []).map((flag) => triageRedFlagSchema.parse(flag)),
    sessionId: value.sessionId ?? '',
  };
});
