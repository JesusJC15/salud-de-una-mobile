import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { billingService } from '@/src/services/billing/billing-service';

export type PaymentState = 'unpaid' | 'paying' | 'paid' | 'loading' | 'error';

export function useConsultationPayment(consultationId: string | null) {
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: ['transactions'],
    queryFn: () => billingService.getMyTransactions(),
    enabled: !!consultationId,
    staleTime: 30_000,
  });

  const alreadyPaid =
    consultationId != null &&
    (transactionsQuery.data ?? []).some(
      (t) =>
        t.consultationId === consultationId && t.status === 'COMPLETED',
    );

  const paidTransaction =
    consultationId != null
      ? (transactionsQuery.data ?? []).find(
          (t) =>
            t.consultationId === consultationId && t.status === 'COMPLETED',
        )
      : undefined;

  const initiateMutation = useMutation({
    mutationFn: (cid: string) => billingService.initiateCheckout(cid),
  });

  const confirmMutation = useMutation({
    mutationFn: (transactionId: string) =>
      billingService.confirmCheckout(transactionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const pay = async () => {
    if (!consultationId) return;
    const transaction = await initiateMutation.mutateAsync(consultationId);
    // Simulated payment gateway delay — replace with real webhook/redirect when integrating a PSP
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await confirmMutation.mutateAsync(transaction.id);
  };

  const isPaying = initiateMutation.isPending || confirmMutation.isPending;
  const isError = initiateMutation.isError || confirmMutation.isError;

  return {
    alreadyPaid,
    paidTransaction,
    isLoading: transactionsQuery.isLoading,
    isPaying,
    isError,
    pay,
  };
}
