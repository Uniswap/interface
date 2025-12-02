import { TradingApi } from '@universe/api'
import { useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { usePendingTransactions, usePendingUniswapXOrders } from 'state/transactions/hooks'
import { isExistingTransaction } from 'state/transactions/utils'
import { useMergeLocalAndRemoteTransactions } from 'uniswap/src/features/activity/hooks/useMergeLocalAndRemoteTransactions'
import { useOpenLimitOrders as useOpenLimitOrdersREST } from 'uniswap/src/features/activity/hooks/useOpenLimitOrders'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import { CancellationGasFeeDetails } from 'uniswap/src/features/gas/hooks'
import { useCancellationGasFeeInfo } from 'uniswap/src/features/gas/hooks/useCancellationGasFeeInfo'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { isLimitOrder } from 'uniswap/src/features/transactions/utils/uniswapX.utils'

export function useOpenLimitOrders(account: string): { openLimitOrders: UniswapXOrderDetails[]; loading: boolean } {
  const dispatch = useDispatch()
  const { data: limitOrders, loading } = useOpenLimitOrdersREST({ evmAddress: account })

  // Sync remote limit orders to local state if they don't exist in state yet
  useEffect(() => {
    if (!limitOrders || limitOrders.length === 0) {
      return
    }

    limitOrders.forEach((order) => {
      if (
        order.status === TransactionStatus.Pending &&
        !isExistingTransaction({ from: order.from, chainId: order.chainId, id: order.id })
      ) {
        dispatch(addTransaction(order))
      }
    })
  }, [dispatch, limitOrders])

  const merged = useMergeLocalAndRemoteTransactions({ evmAddress: account, remoteTransactions: limitOrders })
  const openLimitOrders = useMemo(
    () =>
      (merged ?? []).filter(
        (tx): tx is UniswapXOrderDetails => isLimitOrder(tx) && tx.status === TransactionStatus.Pending,
      ),
    [merged],
  )
  return { openLimitOrders, loading }
}

export function usePendingActivity() {
  const allPendingTransactions = usePendingTransactions()
  const pendingOrders = usePendingUniswapXOrders()

  // Filter out UniswapX orders from pendingTransactions to avoid double-counting
  // UniswapX orders are handled separately via pendingOrders
  const pendingTransactions = allPendingTransactions.filter((tx) => !isUniswapX(tx))
  // Pending limit orders shown in the limit sidebar
  const pendingOrdersWithoutLimits = pendingOrders.filter((order) => order.routing !== TradingApi.Routing.DUTCH_LIMIT)

  const hasPendingActivity = pendingTransactions.length > 0 || pendingOrdersWithoutLimits.length > 0
  const pendingActivityCount = pendingTransactions.length + pendingOrdersWithoutLimits.length
  // Check if any pending transactions are on L1 networks (which need longer delay)
  const hasL1PendingActivity =
    hasPendingActivity && [...pendingTransactions, ...pendingOrdersWithoutLimits].some((tx) => !isL2ChainId(tx.chainId))

  return { hasPendingActivity, pendingActivityCount, hasL1PendingActivity }
}

export function useCancelOrdersGasEstimate(orders?: UniswapXOrderDetails[]): CancellationGasFeeDetails | undefined {
  // Create a representative transaction for gas estimation when orders are available
  const representativeTransaction = useMemo<TransactionDetails | undefined>(() => {
    if (!orders || orders.length === 0) {
      return undefined
    }
    // Use the first order as a representative transaction for gas estimation
    return orders[0]
  }, [orders])

  // Create a placeholder transaction to maintain hook order when no orders are selected
  const placeholderTransaction = useMemo<TransactionDetails>(() => {
    return {
      id: 'placeholder',
      chainId: UniverseChainId.Mainnet,
      from: '0x0000000000000000000000000000000000000000',
      typeInfo: {
        type: TransactionType.Unknown,
      },
      status: TransactionStatus.Pending,
      addedTime: Date.now(),
      hash: undefined,
    } as TransactionDetails
  }, [])

  // Always call the hook to maintain consistent hook order
  // Use the appropriate transaction and optionally pass orders for batch cancellation
  const transactionForHook = representativeTransaction || placeholderTransaction

  // Call the hook unconditionally with the transaction and orders
  // The hook will handle undefined/empty orders internally
  const cancellationGasFeeInfo = useCancellationGasFeeInfo(transactionForHook, orders ?? [])

  // Return undefined when no orders are selected, otherwise return the gas fee info
  return representativeTransaction ? cancellationGasFeeInfo : undefined
}
