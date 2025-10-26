import { useQuery } from '@tanstack/react-query'
import { providers } from 'ethers/lib/ethers'
import { useCallback, useMemo } from 'react'
import { CancellationGasFeeDetails, useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import {
  CancellationType,
  calculateCancellationGasFee,
  createClassicCancelRequest,
  getCancellationType,
} from 'uniswap/src/features/gas/utils/cancel'
import {
  extractCancellationData,
  getCancelMultipleUniswapXOrdersTransaction,
} from 'uniswap/src/features/transactions/cancel/cancelMultipleOrders'
import { getCancelOrderTxRequest } from 'uniswap/src/features/transactions/cancel/getCancelOrderTxRequest'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

/**
 * Hook to calculate cancellation gas fees
 * Supports both single transaction cancellation and batch UniswapX order cancellation
 *
 * @param transaction - The transaction to cancel
 * @param orders - Optional array of UniswapX orders for batch cancellation
 * @returns Cancellation gas fee details or undefined
 */
export function useCancellationGasFeeInfo(
  transaction: TransactionDetails,
  orders?: UniswapXOrderDetails[],
): CancellationGasFeeDetails | undefined {
  // Determine cancellation type
  const cancellationType = useMemo(() => {
    return getCancellationType(transaction, orders)
  }, [transaction, orders])

  // Create classic cancel request (always needed for comparison)
  const classicCancelRequest = useMemo(() => {
    return createClassicCancelRequest(transaction)
  }, [transaction])

  // Get UniswapX cancel request (single or batch)
  const uniswapXCancelRequest = useUniswapXCancelRequest({
    transaction,
    orders,
    cancellationType,
  })

  // Calculate gas fees based on type
  const isUniswapXCancellation = cancellationType === CancellationType.UniswapX
  const cancelRequest = isUniswapXCancellation ? uniswapXCancelRequest : classicCancelRequest

  const gasFee = useTransactionGasFee({
    tx: cancelRequest,
    skip: isUniswapXCancellation && !uniswapXCancelRequest,
  })

  return useMemo(() => {
    return calculateCancellationGasFee({
      type: cancellationType,
      transaction,
      gasFee,
      cancelRequest,
      orders,
    })
  }, [cancellationType, transaction, gasFee, cancelRequest, orders])
}

/**
 * Internal hook to get UniswapX cancellation request
 * Handles both single transaction and batch order cancellation
 */
function useUniswapXCancelRequest({
  transaction,
  orders,
  cancellationType,
}: {
  transaction: TransactionDetails
  orders: UniswapXOrderDetails[] | undefined
  cancellationType: CancellationType
}): providers.TransactionRequest | undefined {
  const cancelRequestFetcher = useCallback(async (): Promise<providers.TransactionRequest | null> => {
    if (cancellationType !== CancellationType.UniswapX) {
      return null
    }
    if (orders && orders.length > 0) {
      const ordersWithEncodedData = extractCancellationData(orders)
      if (ordersWithEncodedData.length === 0) {
        return null
      }

      try {
        const cancelRequest = await getCancelMultipleUniswapXOrdersTransaction({
          orders: ordersWithEncodedData.map((order) => ({
            encodedOrder: order.encodedOrder,
            routing: order.routing,
          })),
          chainId: transaction.chainId,
          from: transaction.from,
        })
        return cancelRequest ?? null
      } catch {
        return null
      }
    }

    if (isUniswapX(transaction)) {
      try {
        const cancelRequest = await getCancelOrderTxRequest(transaction as UniswapXOrderDetails)
        return cancelRequest
      } catch {
        return null
      }
    }

    return null
  }, [cancellationType, orders, transaction])

  const queryKey = useMemo(() => {
    if (orders && orders.length > 0) {
      const orderHashes = orders
        .map((o) => o.orderHash)
        .filter(Boolean)
        .sort()
      return [ReactQueryCacheKey.CancelUniswapXTransactionRequest, 'batch', ...orderHashes]
    }
    return [ReactQueryCacheKey.CancelUniswapXTransactionRequest, transaction.id]
  }, [orders, transaction.id])

  const { data: cancelRequest } = useQuery({
    queryKey,
    queryFn: cancelRequestFetcher,
    enabled: cancellationType === CancellationType.UniswapX,
  })

  return cancelRequest ?? undefined
}
