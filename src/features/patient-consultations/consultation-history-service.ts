import { z } from 'zod';
import { apiClient } from '@/src/services/api/client';

export const consultationHistoryItemSchema = z.object({
  id: z.string(),
  specialty: z.string(),
  priority: z.string(),
  status: z.string(),
  clinicalSummary: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  ratingComment: z.string().optional().nullable(),
  createdAt: z.string().nullable(),
  closedAt: z.string().optional().nullable(),
});

export const consultationDetailSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  triageSessionId: z.string(),
  specialty: z.string(),
  priority: z.string(),
  status: z.string(),
  assignedDoctorId: z.string().optional().nullable(),
  clinicalSummary: z.string().optional().nullable(),
  closedAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  triage: z
    .object({
      status: z.string(),
      answers: z
        .array(
          z.object({
            questionId: z.string(),
            questionText: z.string(),
            answerValue: z.unknown(),
          }),
        )
        .optional(),
      analysis: z
        .object({
          priority: z.string(),
          redFlags: z.array(z.unknown()).optional(),
          aiSummary: z.string().optional().nullable(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
});

export const consultationMessageSchema = z.object({
  id: z.string(),
  consultationId: z.string(),
  senderId: z.string(),
  senderRole: z.string(),
  content: z.string(),
  type: z.string(),
  createdAt: z.string().optional(),
});

export const consultationMessagesResponseSchema = z.object({
  items: z.array(consultationMessageSchema),
  total: z.number(),
});

export const consultationHistoryResponseSchema = z.object({
  items: z.array(consultationHistoryItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export type ConsultationHistoryItem = z.infer<typeof consultationHistoryItemSchema>;
export type ConsultationHistoryResponse = z.infer<typeof consultationHistoryResponseSchema>;
export type ConsultationDetail = z.infer<typeof consultationDetailSchema>;
export type ConsultationMessage = z.infer<typeof consultationMessageSchema>;

export const rateConsultationResponseSchema = z.object({
  id: z.string(),
  rating: z.number(),
  ratingComment: z.string().optional().nullable(),
});

export const consultationHistoryService = {
  async getMyHistory(options: { page?: number; limit?: number; status?: string } = {}): Promise<ConsultationHistoryResponse> {
    const res = await apiClient.get('/consultations/my-history', {
      params: { page: options.page ?? 1, limit: options.limit ?? 20, status: options.status },
    });
    return consultationHistoryResponseSchema.parse(res.data);
  },

  async rateConsultation(consultationId: string, rating: number, ratingComment?: string) {
    const res = await apiClient.post(`/consultations/${consultationId}/rate`, {
      rating,
      ...(ratingComment ? { ratingComment } : {}),
    });
    return rateConsultationResponseSchema.parse(res.data);
  },

  async getById(consultationId: string): Promise<ConsultationDetail> {
    const res = await apiClient.get(`/consultations/${consultationId}`);
    return consultationDetailSchema.parse(res.data);
  },

  async getMessages(consultationId: string, limit = 100) {
    const res = await apiClient.get(`/consultations/${consultationId}/messages`, {
      params: { limit },
    });
    return consultationMessagesResponseSchema.parse(res.data);
  },
};
