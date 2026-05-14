import { z } from 'zod';
import { apiClient } from '@/src/services/api/client';

export const consultationHistoryItemSchema = z.object({
  id: z.string(),
  specialty: z.enum(['GENERAL_MEDICINE', 'ODONTOLOGY', 'URGENT_CARE']),
  priority: z.enum(['LOW', 'MODERATE', 'HIGH']),
  status: z.enum(['PENDING', 'IN_ATTENTION', 'CLOSED']),
  clinicalSummary: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  ratingComment: z.string().optional().nullable(),
  createdAt: z.string().nullable(),
  closedAt: z.string().optional().nullable(),
});

export const consultationHistoryResponseSchema = z.object({
  items: z.array(consultationHistoryItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export type ConsultationHistoryItem = z.infer<typeof consultationHistoryItemSchema>;
export type ConsultationHistoryResponse = z.infer<typeof consultationHistoryResponseSchema>;

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
};
