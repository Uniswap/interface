import { createContext, PropsWithChildren, useCallback, useContext, useState } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

interface TransactionConfirmationState {
  /**
   * Marks that a transaction was just confirmed on the specified chain.
   * This will cause the next transaction on the same chain to be delayed.
   */
  markTransactionConfirmed: (chainId: UniverseChainId) => void

  /**
   * Gets the remaining delay time (in ms) for the given chain based on when
   * the last transaction was confirmed. Returns 0 if no delay is needed.
   */
  getDelayForChainId: (chainId: UniverseChainId, maxDelayMs: number) => number

  /**
   * Clears all confirmation tracking state.
   * Useful for testing or manual reset scenarios.
   */
  clearConfirmationTracking: () => void
}

const TransactionConfirmationContext = createContext<TransactionConfirmationState | null>(null)

export function useTransactionConfirmationTracker(): TransactionConfirmationState {
  const context = useContext(TransactionConfirmationContext)
  if (!context) {
    throw new Error('useTransactionConfirmationTracker must be used within a TransactionConfirmationTrackerProvider')
  }
  return context
}

interface TransactionConfirmationTrackerProviderProps extends PropsWithChildren {}

export function TransactionConfirmationTrackerProvider({
  children,
}: TransactionConfirmationTrackerProviderProps): JSX.Element {
  // Track the timestamp of the last confirmed transaction per chain
  const [lastConfirmedByChain, setLastConfirmedByChain] = useState<Record<UniverseChainId, number>>(
    {} as Record<UniverseChainId, number>,
  )

  const markTransactionConfirmed = useCallback((chainId: UniverseChainId) => {
    setLastConfirmedByChain((prev) => ({
      ...prev,
      [chainId]: Date.now(),
    }))
  }, [])

  const getDelayForChainId = useCallback(
    (chainId: UniverseChainId, maxDelayMs: number): number => {
      // If no previous confirmation for this chain, no delay needed
      const lastConfirmationTime = lastConfirmedByChain[chainId]
      if (!lastConfirmationTime) {
        return 0
      }

      const elapsed = Date.now() - lastConfirmationTime
      const remainingDelay = Math.max(0, maxDelayMs - elapsed)

      return remainingDelay
    },
    [lastConfirmedByChain],
  )

  const clearConfirmationTracking = useCallback(() => {
    setLastConfirmedByChain({} as Record<UniverseChainId, number>)
  }, [])

  const contextValue: TransactionConfirmationState = {
    markTransactionConfirmed,
    getDelayForChainId,
    clearConfirmationTracking,
  }

  return (
    <TransactionConfirmationContext.Provider value={contextValue}>{children}</TransactionConfirmationContext.Provider>
  )
}
