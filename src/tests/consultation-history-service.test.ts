import { consultationHistoryService } from '@/src/features/patient-consultations/consultation-history-service';
import * as clientModule from '@/src/services/api/client';

jest.mock('@/src/services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApiClient = clientModule.apiClient as jest.Mocked<typeof clientModule.apiClient>;

describe('consultationHistoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyHistory', () => {
    it('fetches consultation history with default pagination', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              id: '1',
              specialty: 'General',
              priority: 'MODERATE',
              status: 'CLOSED',
              clinicalSummary: 'Summary',
              rating: null,
              ratingComment: null,
              createdAt: '2024-01-01T00:00:00Z',
              closedAt: '2024-01-02T00:00:00Z',
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await consultationHistoryService.getMyHistory();

      expect(mockApiClient.get).toHaveBeenCalledWith('/consultations/my-history', {
        params: { page: 1, limit: 20, status: undefined },
      });
      expect(result).toEqual(mockResponse.data);
      expect(result.items[0].id).toBe('1');
      expect(result.total).toBe(1);
    });

    it('fetches consultation history with custom pagination', async () => {
      const mockResponse = {
        data: {
          items: [],
          total: 0,
          page: 2,
          limit: 50,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await consultationHistoryService.getMyHistory({ page: 2, limit: 50 });

      expect(mockApiClient.get).toHaveBeenCalledWith('/consultations/my-history', {
        params: { page: 2, limit: 50, status: undefined },
      });
    });

    it('fetches consultation history with status filter', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              id: '1',
              specialty: 'General',
              priority: 'HIGH',
              status: 'PENDING',
              clinicalSummary: null,
              rating: null,
              ratingComment: null,
              createdAt: '2024-01-01T00:00:00Z',
              closedAt: null,
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await consultationHistoryService.getMyHistory({ status: 'PENDING' });

      expect(mockApiClient.get).toHaveBeenCalledWith('/consultations/my-history', {
        params: { page: 1, limit: 20, status: 'PENDING' },
      });
    });

    it('returns empty history', async () => {
      const mockResponse = {
        data: {
          items: [],
          total: 0,
          page: 1,
          limit: 20,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await consultationHistoryService.getMyHistory();

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('handles multiple consultation items', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              id: '1',
              specialty: 'Cardiology',
              priority: 'HIGH',
              status: 'CLOSED',
              clinicalSummary: 'Heart checkup',
              rating: 5,
              ratingComment: 'Great service',
              createdAt: '2024-01-01T00:00:00Z',
              closedAt: '2024-01-02T00:00:00Z',
            },
            {
              id: '2',
              specialty: 'Dermatology',
              priority: 'LOW',
              status: 'CLOSED',
              clinicalSummary: 'Skin checkup',
              rating: 4,
              ratingComment: null,
              createdAt: '2024-01-10T00:00:00Z',
              closedAt: '2024-01-11T00:00:00Z',
            },
          ],
          total: 2,
          page: 1,
          limit: 20,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await consultationHistoryService.getMyHistory();

      expect(result.items).toHaveLength(2);
      expect(result.items[0].specialty).toBe('Cardiology');
      expect(result.items[1].specialty).toBe('Dermatology');
    });

    it('validates response schema', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              id: '1',
              specialty: 'General',
              priority: 'MODERATE',
              status: 'IN_ATTENTION',
              clinicalSummary: null,
              rating: null,
              ratingComment: null,
              createdAt: null,
              closedAt: null,
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await consultationHistoryService.getMyHistory();
      expect(result).toBeDefined();
      expect(result.items[0].priority).toBe('MODERATE');
    });
  });

  describe('rateConsultation', () => {
    it('rates a consultation with rating and comment', async () => {
      const mockResponse = {
        data: {
          id: '1',
          rating: 5,
          ratingComment: 'Excellent doctor',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await consultationHistoryService.rateConsultation('1', 5, 'Excellent doctor');

      expect(mockApiClient.post).toHaveBeenCalledWith('/consultations/1/rate', {
        rating: 5,
        ratingComment: 'Excellent doctor',
      });
      expect(result.rating).toBe(5);
      expect(result.ratingComment).toBe('Excellent doctor');
    });

    it('rates a consultation with rating only (no comment)', async () => {
      const mockResponse = {
        data: {
          id: '1',
          rating: 4,
          ratingComment: null,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await consultationHistoryService.rateConsultation('1', 4);

      expect(mockApiClient.post).toHaveBeenCalledWith('/consultations/1/rate', {
        rating: 4,
      });
      expect(result.rating).toBe(4);
      expect(result.ratingComment).toBeNull();
    });

    it('handles minimum rating (1)', async () => {
      const mockResponse = {
        data: {
          id: '1',
          rating: 1,
          ratingComment: 'Poor service',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await consultationHistoryService.rateConsultation('1', 1, 'Poor service');

      expect(result.rating).toBe(1);
    });

    it('handles maximum rating (5)', async () => {
      const mockResponse = {
        data: {
          id: '1',
          rating: 5,
          ratingComment: 'Excellent',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await consultationHistoryService.rateConsultation('1', 5, 'Excellent');

      expect(result.rating).toBe(5);
    });

    it('rates consultation with empty comment string', async () => {
      const mockResponse = {
        data: {
          id: '1',
          rating: 3,
          ratingComment: null,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await consultationHistoryService.rateConsultation('1', 3, '');

      // Empty string is falsy, so it should NOT be included in the payload
      expect(mockApiClient.post).toHaveBeenCalledWith('/consultations/1/rate', {
        rating: 3,
      });
    });

    it('rates consultation by different consultation IDs', async () => {
      mockApiClient.post.mockResolvedValue({
        data: {
          id: '123',
          rating: 5,
          ratingComment: null,
        },
      });

      await consultationHistoryService.rateConsultation('123', 5);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/consultations/123/rate',
        expect.objectContaining({ rating: 5 }),
      );
    });
  });
});
