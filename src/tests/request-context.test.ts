import { createCorrelationId } from '@/src/services/api/request-context';

describe('createCorrelationId', () => {
  it('creates a mobile correlation id', () => {
    const value = createCorrelationId();

    expect(value).toMatch(/^mobile-[a-z0-9]+-[a-z0-9]+$/);
  });
});
