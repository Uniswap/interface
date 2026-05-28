import { useQuery } from '@tanstack/react-query'
import { useSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import { isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function usePrepareSwapTransactionEffect(): void {
  const acceptedDerivedSwapInfo = useSwapReviewTransactionStore((s) => Boolean(s.acceptedDerivedSwapInfo))
  const prepareSwapTransaction = useSwapDependenciesStore((s) => s.prepareSwapTransaction)
  const validSwapTxContext = useSwapTxStore((s) => (isValidSwapTxContext(s) ? s : undefined))

  // Prepare and sign transaction when component mounts or trade changes
  useQuery({
    queryKey: [
      ReactQueryCacheKey.PrepareSwapTransaction,
      validSwapTxContext,
      acceptedDerivedSwapInfo,
      Boolean(prepareSwapTransaction),
    ],
    queryFn: async (): Promise<true | null> => {
      if (!validSwapTxContext || !acceptedDerivedSwapInfo || !prepareSwapTransaction) {
        return null
      }
      try {
        await prepareSwapTransaction({
          swapTxContext: validSwapTxContext,
        })
        return true
      } catch (error) {
        logger.warn('SwapReviewContent', 'prepareAndSignSwapTransaction', 'Failed to prepare and sign transaction', {
          error,
        })
        return null
      }
    },
    enabled: Boolean(validSwapTxContext && acceptedDerivedSwapInfo && prepareSwapTransaction),
    refetchInterval: false,
  })
}
