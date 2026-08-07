import { TradingApi } from '@universe/api'
import { providers } from 'ethers/lib/ethers'
import { buildSingleCancellation } from 'uniswap/src/features/transactions/cancel/cancelOrderFactory'
import { getOrders } from 'uniswap/src/features/transactions/swap/orders'
import { UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

export type CancelOrderPreCheckResult =
  /** Order is still cancellable; the built cancel tx is ready for the wallet prompt */
  | { kind: 'ready'; cancelRequest: providers.TransactionRequest }
  /** Fresh backend status says the order already left the cancellable set */
  | { kind: 'not-cancellable'; orderStatus: TradingApi.OrderStatus }
  /** No orderHash / no encodedOrder / cancellation tx could not be built — nothing to submit */
  | { kind: 'unavailable' }

/**
 * Fresh cancellable pre-check + cancel tx build, preserving WHY a cancellation cannot proceed so
 * confirm-time callers can surface the refusal instead of silently no-oping.
 */
export async function checkCancelOrder(tx: UniswapXOrderDetails): Promise<CancelOrderPreCheckResult> {
  const { orderHash, chainId, from, routing, encodedOrder: localEncodedOrder } = tx

  if (!orderHash) {
    return { kind: 'unavailable' }
  }

  // Always fetch the latest order status from the API to verify the order is still cancellable
  const apiOrder = (await getOrders([orderHash])).orders[0]
  const currentOrderStatus = apiOrder?.orderStatus

  // If the order is already filled, expired, or cancelled, no point in submitting a cancel tx.
  // INSUFFICIENT_FUNDS is non-final (such orders return to open) and stays cancellable —
  // matches isLimitCancellable.
  if (
    currentOrderStatus &&
    currentOrderStatus !== TradingApi.OrderStatus.OPEN &&
    currentOrderStatus !== TradingApi.OrderStatus.INSUFFICIENT_FUNDS
  ) {
    return { kind: 'not-cancellable', orderStatus: currentOrderStatus }
  }

  // Use locally stored encodedOrder if available, otherwise use the one from the API response
  const encodedOrder = localEncodedOrder ?? apiOrder?.encodedOrder

  if (!encodedOrder) {
    return { kind: 'unavailable' }
  }

  const cancelRequest = await buildSingleCancellation(
    {
      encodedOrder,
      routing,
      chainId,
      orderHash,
    },
    from,
  )

  return cancelRequest ? { kind: 'ready', cancelRequest } : { kind: 'unavailable' }
}

/** Thin wrapper for callers that only need the request (gas estimation) */
export async function getCancelOrderTxRequest(tx: UniswapXOrderDetails): Promise<providers.TransactionRequest | null> {
  const result = await checkCancelOrder(tx)
  return result.kind === 'ready' ? result.cancelRequest : null
}
