import { useCallback, useEffect, useRef } from 'react'
import { useTransactionConfirmationTracker } from 'src/app/features/dappRequests/context/TransactionConfirmationTracker'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'

/**
 * Delay before preparing the next transaction to allow network to recognize
 * the previous transaction and update nonce accordingly.
 *
 * This prevents nonce conflicts when multiple transactions are queued on the same chain:
 * - Transaction 1 is submitted and confirmed by user
 * - Without delay, Transaction 2 pre-signing starts immediately
 * - Network hasn't recognized Transaction 1 as pending yet
 * - Both transactions end up with the same nonce
 *
 * The delay is only applied when:
 * 1. A transaction was just confirmed by the user
 * 2. The next transaction is on the same chainId
 *
 * This gives the network time to update the pending transaction count
 * so the next nonce calculation is accurate.
 */
const TRANSACTION_PRESIGN_DELAY_MS = 1500

/**
 * Hook that provides conditional pre-signing delay based on confirmation tracking.
 *
 * This hook automatically applies a delay when the previous transaction was confirmed on the same chain,
 * giving the network time to recognize the pending transaction before calculating the next nonce.
 *
 * Use this for transaction pre-signing scenarios where nonce conflicts could occur.
 */
export function useConditionalPreSignDelay(options: {
  callback: () => void | Promise<void>
  chainId: UniverseChainId | undefined
}): void {
  const { callback, chainId } = options
  const { getDelayForChainId } = useTransactionConfirmationTracker()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Create stable execute function that handles promise rejections
  const executeCallback = useCallback(async () => {
    try {
      await callback()
    } catch (error) {
      logger.error(error, {
        tags: {
          file: 'useConditionalPreSignDelay.ts',
          function: 'executeCallback',
        },
      })
    } finally {
      timeoutRef.current = null
    }
  }, [callback])

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Get remaining delay time based on when last transaction was confirmed
    const delayMs = chainId ? getDelayForChainId(chainId, TRANSACTION_PRESIGN_DELAY_MS) : 0

    // Set up execution with conditional delay
    timeoutRef.current = setTimeout(() => {
      executeCallback()
    }, delayMs)

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [executeCallback, getDelayForChainId, chainId])
}
