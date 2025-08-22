import { SwapSummaryCallbacks } from 'uniswap/src/components/activity/types'

import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const MAX_SHOW_RETRY_TIME = 15 * ONE_MINUTE_MS

export function useOnRetrySwap(
  transaction: TransactionDetails,
  swapCallbacks: SwapSummaryCallbacks | undefined,
): (() => void) | undefined {
  // For retrying failed, locally submitted swaps
  const swapFormState = swapCallbacks?.useSwapFormTransactionState({
    address: transaction.from,
    chainId: transaction.chainId,
    txId: transaction.id,
  })

  const latestSwapTx = swapCallbacks?.useLatestSwapTransaction(transaction.from)
  const isTheLatestSwap = latestSwapTx && latestSwapTx.id === transaction.id
  // if this is the latest tx or it was added within the last 15 minutes, show the retry button
  const shouldShowRetry =
    isTheLatestSwap || (Date.now() - transaction.addedTime < MAX_SHOW_RETRY_TIME && swapCallbacks?.onRetryGenerator)

  const onRetry = swapCallbacks?.onRetryGenerator?.(swapFormState)
  return swapFormState && shouldShowRetry ? onRetry : undefined
}
