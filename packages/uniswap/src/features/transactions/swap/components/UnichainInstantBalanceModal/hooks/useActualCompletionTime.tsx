import { useMemo } from 'react'
import { useCurrentFlashblocksTransaction } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useCurrentFlashblocksTransaction'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

export function useActualCompletionTime(): number | undefined {
  // Get instant receipt fetch time from swap state
  const instantReceiptFetchTime = useSwapFormStore((s) => s.instantReceiptFetchTime)
  const txHashReceivedTime = useSwapFormStore((s) => s.txHashReceivedTime)

  const transaction = useCurrentFlashblocksTransaction()

  // Calculate actual confirm time using instant receipt fetch time if available, otherwise fallback to transaction timing data
  const confirmTimeSeconds = useMemo(() => {
    if (!transaction) {
      return undefined
    }

    const txRpcSubmissionTime =
      'options' in transaction
        ? transaction.addedTime + (transaction.options.rpcSubmissionDelayMs || 0)
        : txHashReceivedTime || transaction.addedTime // transaction.addedTime is used for UniswapX

    if (!txRpcSubmissionTime) {
      return undefined
    }

    let confirmedTime: number | undefined

    confirmedTime = transaction.receipt?.confirmedTime

    if (!confirmedTime || (instantReceiptFetchTime && instantReceiptFetchTime < confirmedTime)) {
      confirmedTime = instantReceiptFetchTime
    }

    if (!confirmedTime) {
      return undefined
    }

    const rawConfirmTime = (confirmedTime - txRpcSubmissionTime) / 1000

    // Round to nearest 0.1
    const roundedConfirmTime = Math.round(rawConfirmTime * 10) / 10

    return roundedConfirmTime
  }, [transaction, instantReceiptFetchTime, txHashReceivedTime])

  return confirmTimeSeconds
}
