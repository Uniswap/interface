import { useEffect, useMemo } from 'react'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { usePendingTransactions } from 'uniswap/src/features/transactions/hooks/usePendingTransactions'
import { LIQUIDITY_TRANSACTION_TYPES } from 'uniswap/src/features/transactions/types/transactionDetails'
import { usePrevious } from 'utilities/src/react/hooks'

/**
 * Cross-platform analog of the web-only `usePendingLPTransactionsChangeListener`. Invokes
 * `callback` whenever the count of pending LP transactions for the active account changes —
 * i.e. when an add/remove-liquidity, collect-fees, create-pool/pair, or migrate transaction is
 * submitted or settles. Consumers (e.g. the extension Pools tab) pass a `refetch` so the
 * positions list refreshes off the same signal the web Pools tab uses.
 *
 * Fires only on post-mount changes; the initial mount does not trigger the callback.
 */
export function usePendingLiquidityTransactionsChangeListener(callback: () => void): void {
  const { evmAddress, svmAddress } = useActiveAddresses()
  const pendingTransactions = usePendingTransactions({ evmAddress: evmAddress ?? null, svmAddress: svmAddress ?? null })

  const pendingLiquidityCount = useMemo(
    () => (pendingTransactions ?? []).filter((tx) => LIQUIDITY_TRANSACTION_TYPES.includes(tx.typeInfo.type)).length,
    [pendingTransactions],
  )
  const previousPendingLiquidityCount = usePrevious(pendingLiquidityCount)

  useEffect(() => {
    if (previousPendingLiquidityCount !== undefined && pendingLiquidityCount !== previousPendingLiquidityCount) {
      callback()
    }
  }, [pendingLiquidityCount, previousPendingLiquidityCount, callback])
}
