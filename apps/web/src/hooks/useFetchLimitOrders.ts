import { useMutation } from '@tanstack/react-query'
import { fetchOpenLimitOrders } from 'state/activity/polling/orders'
import { LimitOrderResponse } from 'uniswap/src/features/transactions/cancel/cancelMultipleOrders'
import { logger } from 'utilities/src/logger/logger'

/**
 * Fetches limit orders by orderHashes.
 */
export function useFetchLimitOrders() {
  return useMutation({
    mutationFn: async (orderHashes: string[]): Promise<LimitOrderResponse[]> => {
      try {
        const response = await fetchOpenLimitOrders({ orderHashes })
        return response
          .filter((order) => order.encodedOrder && order.orderHash)
          .map(({ orderHash, encodedOrder, orderStatus }) => ({
            orderHash,
            encodedOrder,
            orderStatus,
          }))
      } catch (error) {
        logger.error(error, {
          tags: { file: 'useFetchLimitOrders.ts', function: 'useFetchLimitOrders' },
          extra: { orderHashes },
        })
        throw error
      }
    },
  })
}
