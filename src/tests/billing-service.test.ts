import { apiClient } from '@/src/services/api/client';
import { billingService } from '@/src/services/billing/billing-service';

jest.mock('@/src/services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('billingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets billing prices', async () => {
    const prices = [{ specialty: 'GENERAL_MEDICINE', amount: 25000, currency: 'COP', active: true }];
    (apiClient.get as jest.Mock).mockResolvedValue({ data: prices });

    await expect(billingService.getPrices()).resolves.toEqual(prices);
    expect(apiClient.get).toHaveBeenCalledWith('/billing/prices');
  });

  it('initiates checkout for a consultation', async () => {
    const transaction = {
      id: 'tx-1',
      consultationId: 'consult-1',
      specialty: 'GENERAL_MEDICINE',
      amount: 25000,
      currency: 'COP',
      status: 'PENDING',
    };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: transaction });

    await expect(billingService.initiateCheckout('consult-1')).resolves.toEqual(transaction);
    expect(apiClient.post).toHaveBeenCalledWith('/billing/checkout', {
      consultationId: 'consult-1',
    });
  });

  it('confirms checkout transaction', async () => {
    const transaction = {
      id: 'tx-1',
      consultationId: 'consult-1',
      specialty: 'GENERAL_MEDICINE',
      amount: 25000,
      currency: 'COP',
      status: 'COMPLETED',
      paidAt: '2026-05-14T12:00:00.000Z',
    };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: transaction });

    await expect(billingService.confirmCheckout('tx-1')).resolves.toEqual(transaction);
    expect(apiClient.post).toHaveBeenCalledWith('/billing/checkout/tx-1/confirm');
  });

  it('returns transaction items from paginated payload', async () => {
    const items = [
      {
        id: 'tx-1',
        consultationId: 'consult-1',
        specialty: 'GENERAL_MEDICINE',
        amount: 25000,
        currency: 'COP',
        status: 'COMPLETED',
      },
    ];
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { items, total: 1, page: 1, limit: 10 },
    });

    await expect(billingService.getMyTransactions()).resolves.toEqual(items);
    expect(apiClient.get).toHaveBeenCalledWith('/billing/transactions/me');
  });
});
