import { TradingApi } from '@universe/api'
import { providers } from 'ethers/lib/ethers'
import { buildSingleCancellation } from 'uniswap/src/features/transactions/cancel/cancelOrderFactory'
import { getOrders } from 'uniswap/src/features/transactions/swap/orders'
import { UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

export async function getCancelOrderTxRequest(tx: UniswapXOrderDetails): Promise<providers.TransactionRequest | null> {
  const { orderHash, chainId, from, routing, encodedOrder: localEncodedOrder } = tx

  if (!orderHash) {
    return null
  }

  // Always fetch the latest order status from the API to verify the order is still cancellable
  const apiOrder = (await getOrders([orderHash])).orders[0]
  const currentOrderStatus = apiOrder?.orderStatus

  // If the order is already filled, expired, or cancelled, no point in submitting a cancel tx
  if (currentOrderStatus && currentOrderStatus !== TradingApi.OrderStatus.OPEN) {
    return null
  }

  // Use locally stored encodedOrder if available, otherwise use the one from the API response
  const encodedOrder = localEncodedOrder ?? apiOrder?.encodedOrder

  if (!encodedOrder) {
    return null
  }

  return buildSingleCancellation(
    {
      encodedOrder,
      routing,
      chainId,
      orderHash,
    },
    from,
  )
}
