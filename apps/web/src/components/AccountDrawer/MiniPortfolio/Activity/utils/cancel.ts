import { TradingApi } from '@universe/api'
import { ContractTransaction } from 'ethers/lib/ethers'
import { useAccount } from 'hooks/useAccount'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import { useFetchLimitOrders } from 'hooks/useFetchLimitOrders'
import useSelectChain from 'hooks/useSelectChain'
import { useCallback, useMemo } from 'react'
import store from 'state'
import { useAppDispatch } from 'state/hooks'
import {
  cancelMultipleUniswapXOrders,
  extractCancellationData,
  fetchLimitOrdersEncodedOrderData,
  getOrdersMatchingCancellationData,
  LimitOrdersFetcher,
  trackOrderCancellation,
} from 'uniswap/src/features/transactions/cancel/cancelMultipleOrders'
import { validateOrdersForCancellation } from 'uniswap/src/features/transactions/cancel/validation'
import { updateTransaction } from 'uniswap/src/features/transactions/slice'
import { TransactionStatus, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { WrongChainError } from 'utils/errors'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

type AppDispatch = typeof store.dispatch

/**
 * Updates order status to Cancelling for UI feedback
 */
function markOrdersAsCancelling(orders: UniswapXOrderDetails[], dispatch: AppDispatch): void {
  orders.forEach((order) => {
    dispatch(
      updateTransaction({
        ...order,
        status: TransactionStatus.Cancelling,
      }),
    )
  })
}

/**
 * Reverts order statuses back to their original values if cancellation fails
 */
function revertOrdersStatuses({
  orders,
  originalStatuses,
  dispatch,
}: {
  orders: UniswapXOrderDetails[]
  originalStatuses: Map<string, TransactionStatus>
  dispatch: AppDispatch
}): void {
  orders.forEach((order) => {
    const originalStatus = originalStatuses.get(order.id) ?? order.status
    dispatch(
      updateTransaction({
        ...order,
        status: originalStatus,
      }),
    )
  })
}

/**
 * Hook to cancel multiple UniswapX orders
 * Handles validation, fetching missing data, status updates, and execution
 */
export function useCancelMultipleOrdersCallback(
  orders?: UniswapXOrderDetails[],
): () => Promise<ContractTransaction[] | undefined> {
  const account = useAccount()
  const provider = useEthersWeb3Provider()
  const selectChain = useSelectChain()
  const dispatch = useAppDispatch()
  const fetchLimitOrdersMutation = useFetchLimitOrders()

  // Validate orders can be cancelled
  const validation = useMemo(() => validateOrdersForCancellation(orders ?? []), [orders])

  return useCallback(async () => {
    // Bail early if validation failed
    if (!orders || orders.length === 0 || validation.error) {
      const error = validation.error || new Error('No orders to cancel')
      logger.error(error, {
        tags: { file: 'cancel.utils.ts', function: 'useCancelMultipleOrdersCallback' },
        extra: { orders },
      })
      return undefined
    }

    // Store original statuses for potential reversion
    const originalStatuses = new Map<string, TransactionStatus>()
    orders.forEach((order) => {
      originalStatuses.set(order.id, order.status)
    })

    // Declare ordersToCancel at the function scope so it's available in catch block
    let ordersToCancel: UniswapXOrderDetails[] = []

    try {
      // Send analytics event
      trackOrderCancellation(orders)

      // Extract data from orders that already have encodedOrder
      const cancellationData = extractCancellationData(orders)

      // Create the limit orders fetcher for dependency injection
      const limitOrdersFetcher: LimitOrdersFetcher = async (orderHashes: string[]) => {
        const result = await fetchLimitOrdersMutation.mutateAsync(orderHashes)
        return result
      }

      const fetched = await fetchLimitOrdersEncodedOrderData(orders, limitOrdersFetcher)
      if (fetched.length > 0) {
        cancellationData.push(...fetched)
      }

      // If no orders have the required data, we can't proceed
      if (cancellationData.length === 0) {
        logger.warn('cancel.utils', 'useCancelMultipleOrdersCallback', 'No orders with encoded data available', {
          orderCount: orders.length,
        })
        return undefined
      }

      // Filter to only the orders we can actually cancel
      ordersToCancel = getOrdersMatchingCancellationData(orders, cancellationData)

      // Optimistically update UI to show orders are being cancelled
      markOrdersAsCancelling(ordersToCancel, dispatch)

      // Switch to the correct chain if needed
      const switchChainResult = await selectChain(validation.chainId!)
      if (!switchChainResult) {
        throw new WrongChainError()
      }

      // Execute the actual cancellation transaction on-chain
      const txs = await cancelMultipleUniswapXOrders({
        orders: cancellationData.map((data: { encodedOrder: string; routing: TradingApi.Routing }) => ({
          encodedOrder: data.encodedOrder,
          routing: data.routing,
        })),
        provider,
        signerAddress: account.address,
        chainId: validation.chainId!,
      })

      // Critical: Check if cancellation returned transactions
      // cancelMultipleUniswapXOrders can return undefined without throwing (e.g., user rejection, no provider)
      // Without this check, orders would remain stuck in "Cancelling" state
      if (!txs || txs.length === 0) {
        revertOrdersStatuses({ orders: ordersToCancel, originalStatuses, dispatch })
        logger.warn('cancel.utils', 'useCancelMultipleOrdersCallback', 'Cancellation returned no transactions')
        return undefined
      }

      return txs
    } catch (error) {
      // If cancellation fails, revert the UI status back to their original values
      revertOrdersStatuses({ orders: ordersToCancel, originalStatuses, dispatch })

      // Log the error (unless user explicitly rejected the transaction)
      if (!didUserReject(error)) {
        const captureContext = {
          tags: { file: 'cancel.utils.ts', function: 'useCancelMultipleOrdersCallback' },
          extra: { orders },
        }
        logger.error(error, captureContext)
      }
      return undefined
    }
  }, [
    orders,
    provider,
    selectChain,
    dispatch,
    validation.error,
    validation.chainId,
    account.address,
    fetchLimitOrdersMutation,
  ])
}
