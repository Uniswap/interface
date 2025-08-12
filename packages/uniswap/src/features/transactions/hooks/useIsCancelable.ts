import { useEffect, useState } from 'react'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import { isBridge, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

// For L2 chains, delay showing cancel option by 2 seconds
const L2_CANCEL_DELAY_MS = 2 * ONE_SECOND_MS

export function useIsCancelable(tx: TransactionDetails): boolean {
  const shouldDelayCancel = isL2ChainId(tx.chainId)
  const [hasDelayPassed, setHasDelayPassed] = useState(
    shouldDelayCancel ? Date.now() - tx.addedTime > L2_CANCEL_DELAY_MS : true,
  )

  // Force re-render when delay has passed for L2 chains
  useEffect(() => {
    if (shouldDelayCancel && !hasDelayPassed) {
      const timeRemaining = L2_CANCEL_DELAY_MS - (Date.now() - tx.addedTime)
      if (timeRemaining > 0) {
        const timeout = setTimeout(() => {
          setHasDelayPassed(true)
        }, timeRemaining)
        return () => clearTimeout(timeout)
      }
    }
    return undefined
  }, [shouldDelayCancel, hasDelayPassed, tx.addedTime])

  const isSentBridge = isBridge(tx) && tx.sendConfirmed
  const isPending = tx.status === TransactionStatus.Pending
  const wasSubmitted = isUniswapX(tx) || Object.keys(tx.options.request).length > 0

  return !isSentBridge && isPending && wasSubmitted && hasDelayPassed
}
