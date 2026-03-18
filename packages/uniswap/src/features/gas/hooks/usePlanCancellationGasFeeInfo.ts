import { useQuery } from '@tanstack/react-query'
import { providers } from 'ethers/lib/ethers'
import { useMemo } from 'react'
import { CancellationGasFeeDetails, useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import {
  calculateClassicCancellationGas,
  calculateUniswapXCancellationGas,
  createClassicCancelRequest,
} from 'uniswap/src/features/gas/utils/cancel'
import { buildSingleCancellation } from 'uniswap/src/features/transactions/cancel/cancelOrderFactory'
import { CancelableStepInfo, findCancelableStepInPlan } from 'uniswap/src/features/transactions/hooks/useIsCancelable'
import { getOrders } from 'uniswap/src/features/transactions/swap/orders'
import { PlanTransactionDetails, PlanTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export interface PlanCancellationGasFeeDetails extends CancellationGasFeeDetails {
  cancelableStepInfo: CancelableStepInfo
}

/**
 * Hook to calculate gas fees for cancelling a plan step.
 * Handles both classic (nonce replacement) and UniswapX (permit2 invalidation) steps.
 *
 * @param transaction - The plan transaction to potentially cancel
 * @returns Plan cancellation gas fee details including the cancelable step info
 */
export function usePlanCancellationGasFeeInfo(
  transaction: PlanTransactionDetails | undefined,
): PlanCancellationGasFeeDetails | undefined {
  // Find the cancelable step
  const cancelableStepInfo = useMemo(() => {
    if (!transaction) {
      return undefined
    }
    const typeInfo = transaction.typeInfo as PlanTransactionInfo
    return findCancelableStepInPlan(typeInfo)
  }, [transaction])

  // For UniswapX steps, fetch the encoded order and build cancellation request.
  // Plan steps are TransactionDetails (not TradingApi.PlanStep), so orderId comes from step.hash.
  const { data: uniswapXCancelRequest } = useQuery({
    queryKey: [ReactQueryCacheKey.CancelPlanStepRequest, cancelableStepInfo?.orderId],
    queryFn: async (): Promise<providers.TransactionRequest | null> => {
      if (
        !cancelableStepInfo ||
        cancelableStepInfo.cancellationType !== 'uniswapx' ||
        !cancelableStepInfo.orderId ||
        !cancelableStepInfo.routing ||
        !transaction
      ) {
        return null
      }

      try {
        // Fetch encoded order from orders API
        // The orderId comes from step.hash for UniswapX plan steps
        const ordersResponse = await getOrders([cancelableStepInfo.orderId])
        const order = ordersResponse.orders[0]

        if (!order?.encodedOrder) {
          logger.warn('usePlanCancellationGasFeeInfo', 'queryFn', 'No encodedOrder found for order', {
            orderId: cancelableStepInfo.orderId,
          })
          return null
        }

        // Build the permit2 invalidation transaction
        const cancelRequest = await buildSingleCancellation(
          {
            encodedOrder: order.encodedOrder,
            routing: cancelableStepInfo.routing,
            chainId: transaction.chainId,
            orderHash: cancelableStepInfo.orderId,
          },
          transaction.from,
        )

        return cancelRequest
      } catch (error) {
        logger.error(error, {
          tags: { file: 'usePlanCancellationGasFeeInfo', function: 'queryFn' },
          extra: { orderId: cancelableStepInfo.orderId },
        })
        return null
      }
    },
    enabled: cancelableStepInfo?.cancellationType === 'uniswapx' && !!cancelableStepInfo.orderId,
  })

  // For classic/bridge/wrap steps, create the cancel request
  const classicCancelRequest = useMemo(() => {
    if (!cancelableStepInfo || cancelableStepInfo.cancellationType !== 'classic' || !transaction) {
      return undefined
    }

    // Create cancel request based on the step's transaction
    return createClassicCancelRequest(cancelableStepInfo.step)
  }, [cancelableStepInfo, transaction])

  // Determine which cancel request to use
  const cancelRequest =
    cancelableStepInfo?.cancellationType === 'uniswapx' ? uniswapXCancelRequest : classicCancelRequest

  // Get gas fee for the cancel request
  const gasFee = useTransactionGasFee({
    tx: cancelRequest ?? undefined,
    skip: !cancelRequest,
  })

  return useMemo(() => {
    if (!cancelableStepInfo || !cancelRequest) {
      return undefined
    }

    if (cancelableStepInfo.cancellationType === 'classic') {
      const { step } = cancelableStepInfo
      const cancellationDetails = calculateClassicCancellationGas(step, gasFee)

      if (!cancellationDetails) {
        return undefined
      }

      return {
        ...cancellationDetails,
        cancelableStepInfo,
      }
    }

    // For UniswapX, gas fee is directly from the cancel request estimation
    const cancellationDetails = calculateUniswapXCancellationGas(cancelRequest, gasFee)

    if (!cancellationDetails) {
      return undefined
    }

    return {
      ...cancellationDetails,
      cancelableStepInfo,
    }
  }, [cancelableStepInfo, gasFee, cancelRequest])
}
