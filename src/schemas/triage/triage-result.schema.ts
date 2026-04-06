import { z } from 'zod';

import { TriageRedFlag, TriageResult } from '@/src/types/triage';

export const triagePrioritySchema = z.enum(['LOW', 'MODERATE', 'HIGH']);

const triageRedFlagRawSchema = z
  .object({
    description: z.string().trim().nullish(),
    id: z.string().trim().optional(),
    message: z.string().trim().optional(),
    subtitle: z.string().trim().optional(),
    text: z.string().trim().optional(),
    title: z.string().trim().optional(),
  })
  .passthrough();

export const triageRedFlagSchema = triageRedFlagRawSchema.transform<TriageRedFlag>((value) => ({
  description: value.description ?? value.subtitle ?? value.message ?? null,
  id: value.id ?? null,
  title: value.title ?? value.text ?? value.message ?? 'Senal de alerta',
}));

export const triageResultRawSchema = z
  .object({
    analyzedAt: z.string().trim().nullish(),
    priority: triagePrioritySchema,
    redFlags: z.array(triageRedFlagRawSchema).optional(),
    sessionId: z.string().trim().optional(),
    warningSigns: z.array(triageRedFlagRawSchema).optional(),
  })
  .passthrough();

export const triageResultSchema = triageResultRawSchema.transform<TriageResult>((value) => ({
  analyzedAt: value.analyzedAt ?? null,
  priority: value.priority,
  redFlags: (value.redFlags ?? value.warningSigns ?? []).map((flag) => triageRedFlagSchema.parse(flag)),
  sessionId: value.sessionId ?? '',
}));
