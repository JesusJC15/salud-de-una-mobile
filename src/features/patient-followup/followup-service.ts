import { z } from 'zod';
import { apiClient } from '@/src/services/api/client';

export const followupSchema = z.object({
  id: z.string(),
  consultationId: z.string(),
  patientId: z.string(),
  doctorId: z.string().optional().nullable(),
  scheduledAt: z.string(),
  reminderAt: z.string(),
  status: z.enum(['PENDING', 'REMINDED', 'COMPLETED', 'MISSED']),
  baselineSymptomSeverity: z.number(),
  currentSymptomSeverity: z.number().nullable(),
  change: z.enum(['BETTER', 'SAME', 'WORSE']).nullable(),
  medicationTaken: z.boolean().nullable(),
  medicationNotes: z.string().nullable(),
  newSymptoms: z.string().nullable(),
  submittedAt: z.string().nullable(),
  priorityEscalated: z.boolean(),
  createdConsultationId: z.string().nullable(),
});

export const followupListResponseSchema = z.object({
  items: z.array(followupSchema),
});

export const timelineEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  occurredAt: z.string(),
  title: z.string(),
  subtitle: z.string(),
  resourceId: z.string().optional(),
});

export const timelineResponseSchema = z.object({
  items: z.array(timelineEventSchema),
  nextCursor: z.string().nullable(),
});

export type Followup = z.infer<typeof followupSchema>;
export type TimelineEvent = z.infer<typeof timelineEventSchema>;

export const followupService = {
  async listMine(status?: string) {
    const res = await apiClient.get('/followups/mine', {
      params: status ? { status } : undefined,
    });
    return followupListResponseSchema.parse(res.data);
  },

  async getById(followupId: string) {
    const res = await apiClient.get(`/followups/${followupId}`);
    return followupSchema.parse(res.data);
  },

  async submit(input: {
    followupId: string;
    currentSymptomSeverity: number;
    change: 'BETTER' | 'SAME' | 'WORSE';
    medicationTaken: boolean;
    medicationNotes?: string;
    newSymptoms?: string;
  }) {
    const res = await apiClient.post('/followups', input);
    return res.data as {
      followup: Followup;
      priorityEscalated: boolean;
      createdConsultationId: string | null;
    };
  },

  async getTimeline(patientId: string, cursor?: string) {
    const res = await apiClient.get(`/patients/${patientId}/timeline`, {
      params: { cursor, limit: 20 },
    });
    return timelineResponseSchema.parse(res.data);
  },
};
