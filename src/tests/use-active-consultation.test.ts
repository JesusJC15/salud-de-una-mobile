// Mock native modules transitively pulled in by session-store → token-storage
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));

// eslint-disable-next-line import/first
import { findActiveConsultation } from '@/src/features/patient-consultations/use-active-consultation';

describe('findActiveConsultation', () => {
  const makeItem = (id: string, status: 'PENDING' | 'IN_ATTENTION' | 'CLOSED') => ({
    id,
    status,
    specialty: 'GENERAL_MEDICINE' as const,
    priority: 'LOW' as const,
    clinicalSummary: null,
    rating: null,
    ratingComment: null,
    createdAt: '2026-05-01T00:00:00Z',
    closedAt: null,
  });

  it('returns null when list is empty', () => {
    expect(findActiveConsultation([])).toBeNull();
  });

  it('returns null when all consultations are CLOSED', () => {
    expect(findActiveConsultation([makeItem('c1', 'CLOSED'), makeItem('c2', 'CLOSED')])).toBeNull();
  });

  it('returns the PENDING consultation', () => {
    const result = findActiveConsultation([makeItem('c1', 'CLOSED'), makeItem('c2', 'PENDING')]);
    expect(result?.id).toBe('c2');
  });

  it('prefers IN_ATTENTION over PENDING', () => {
    const result = findActiveConsultation([
      makeItem('c1', 'PENDING'),
      makeItem('c2', 'IN_ATTENTION'),
    ]);
    expect(result?.id).toBe('c2');
  });

  it('returns PENDING when no IN_ATTENTION exists', () => {
    const result = findActiveConsultation([
      makeItem('c1', 'CLOSED'),
      makeItem('c2', 'PENDING'),
    ]);
    expect(result?.id).toBe('c2');
  });

  it('returns IN_ATTENTION even if it comes after CLOSED and PENDING', () => {
    const result = findActiveConsultation([
      makeItem('c1', 'CLOSED'),
      makeItem('c2', 'PENDING'),
      makeItem('c3', 'IN_ATTENTION'),
    ]);
    expect(result?.id).toBe('c3');
  });
});
