import { followupService } from '@/src/features/patient-followup/followup-service';
import * as clientModule from '@/src/services/api/client';

jest.mock('@/src/services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApiClient = clientModule.apiClient as jest.Mocked<typeof clientModule.apiClient>;

const mockFollowup = {
  id: 'f1',
  consultationId: 'c1',
  patientId: 'p1',
  doctorId: null,
  scheduledAt: '2026-05-10T00:00:00Z',
  reminderAt: '2026-05-10T00:00:00Z',
  status: 'PENDING' as const,
  baselineSymptomSeverity: 5,
  currentSymptomSeverity: null,
  change: null,
  medicationTaken: null,
  medicationNotes: null,
  newSymptoms: null,
  submittedAt: null,
  priorityEscalated: false,
  createdConsultationId: null,
};

describe('followupService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('listMine', () => {
    it('returns parsed followup list without status filter', async () => {
      mockApiClient.get.mockResolvedValue({ data: { items: [mockFollowup] } });

      const result = await followupService.listMine();

      expect(mockApiClient.get).toHaveBeenCalledWith('/followups/mine', { params: undefined });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('f1');
    });

    it('passes status filter when provided', async () => {
      mockApiClient.get.mockResolvedValue({ data: { items: [] } });

      await followupService.listMine('PENDING');

      expect(mockApiClient.get).toHaveBeenCalledWith('/followups/mine', { params: { status: 'PENDING' } });
    });
  });

  describe('getById', () => {
    it('returns a parsed followup by id', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockFollowup });

      const result = await followupService.getById('f1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/followups/f1');
      expect(result.id).toBe('f1');
    });
  });

  describe('submit', () => {
    it('posts followup submission and returns raw data', async () => {
      const responseData = {
        followup: { ...mockFollowup, status: 'COMPLETED' as const },
        priorityEscalated: false,
        createdConsultationId: null,
      };
      mockApiClient.post.mockResolvedValue({ data: responseData });

      const input = {
        followupId: 'f1',
        currentSymptomSeverity: 3,
        change: 'BETTER' as const,
        medicationTaken: true,
      };

      const result = await followupService.submit(input);

      expect(mockApiClient.post).toHaveBeenCalledWith('/followups', input);
      expect(result.priorityEscalated).toBe(false);
    });

    it('returns escalated flag and new consultation id when worsening', async () => {
      const responseData = {
        followup: { ...mockFollowup, status: 'COMPLETED' as const, change: 'WORSE' as const },
        priorityEscalated: true,
        createdConsultationId: 'c-new',
      };
      mockApiClient.post.mockResolvedValue({ data: responseData });

      const result = await followupService.submit({
        followupId: 'f1',
        currentSymptomSeverity: 8,
        change: 'WORSE',
        medicationTaken: false,
        medicationNotes: 'stopped',
        newSymptoms: 'fever',
      });

      expect(result.priorityEscalated).toBe(true);
      expect(result.createdConsultationId).toBe('c-new');
    });
  });

  describe('getTimeline', () => {
    it('returns parsed timeline without cursor', async () => {
      const response = {
        items: [{ id: 'e1', type: 'CONSULTATION_CLOSED', occurredAt: '2026-05-01T00:00:00Z', title: 'Cerrada', subtitle: 'Desc' }],
        nextCursor: null,
      };
      mockApiClient.get.mockResolvedValue({ data: response });

      const result = await followupService.getTimeline('p1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/patients/p1/timeline', { params: { cursor: undefined, limit: 20 } });
      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
    });

    it('passes cursor when provided', async () => {
      mockApiClient.get.mockResolvedValue({ data: { items: [], nextCursor: null } });

      await followupService.getTimeline('p1', 'cursor-abc');

      expect(mockApiClient.get).toHaveBeenCalledWith('/patients/p1/timeline', { params: { cursor: 'cursor-abc', limit: 20 } });
    });
  });
});
