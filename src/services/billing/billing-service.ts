import { apiClient } from '@/src/services/api/client';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'REFUNDED';

export type BillingPrice = {
  specialty: string;
  amount: number;
  currency: string;
  active: boolean;
};

export type Transaction = {
  id: string;
  consultationId: string;
  specialty: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paidAt?: string;
  createdAt?: string;
};

export const billingService = {
  async getPrices(): Promise<BillingPrice[]> {
    const res = await apiClient.get<BillingPrice[]>('/billing/prices');
    return res.data;
  },

  async initiateCheckout(consultationId: string): Promise<Transaction> {
    const res = await apiClient.post<Transaction>('/billing/checkout', {
      consultationId,
    });
    return res.data;
  },

  async confirmCheckout(transactionId: string): Promise<Transaction> {
    const res = await apiClient.post<Transaction>(
      `/billing/checkout/${transactionId}/confirm`,
    );
    return res.data;
  },

  async getMyTransactions(): Promise<Transaction[]> {
    const res = await apiClient.get<{ items: Transaction[]; total: number; page: number; limit: number }>(
      '/billing/transactions/me',
    );
    return res.data.items;
  },
};
