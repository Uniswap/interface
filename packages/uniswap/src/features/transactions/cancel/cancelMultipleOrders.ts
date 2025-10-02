import { TradingApi } from '@universe/api'
import { ContractTransaction, providers } from 'ethers/lib/ethers'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { buildBatchCancellation } from 'uniswap/src/features/transactions/cancel/cancelOrderFactory'
import { hasValidCancellationData } from 'uniswap/src/features/transactions/cancel/validation'
import { UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { hasEncodedOrder } from 'uniswap/src/features/transactions/utils/uniswapX.utils'
import { logger } from 'utilities/src/logger/logger'

interface OrderWithEncodedData {
  orderHash: string
  encodedOrder: string
  routing: TradingApi.Routing
}

export interface LimitOrderResponse {
  orderHash: string
  encodedOrder: string
  orderStatus: TradingApi.OrderStatus
}

export type LimitOrdersFetcher = (orderHashes: string[]) => Promise<LimitOrderResponse[]>

/**
 * Sends analytics event for order cancellation
 */
export function trackOrderCancellation(orders: UniswapXOrderDetails[]): void {
  const orderHashes = orders.map((order) => order.orderHash).filter((hash): hash is string => hash !== undefined)

  sendAnalyticsEvent(InterfaceEventName.UniswapXOrderCancelInitiated, {
    orders: orderHashes,
  })
}

/**
 * Extracts cancellation data from orders that have all required fields.
 * Returns the data needed to execute the cancellation transaction.
 * Only processes orders that already have encodedOrder available locally.
 */
export function extractCancellationData(orders: UniswapXOrderDetails[]): Array<OrderWithEncodedData> {
  const result: OrderWithEncodedData[] = []

  // Only process orders that have encodedOrder locally
  // Orders from parseRemote should already have encodedOrder if they're cancellable
  orders.forEach((order) => {
    if (hasValidCancellationData(order)) {
      result.push({
        orderHash: order.orderHash,
        encodedOrder: order.encodedOrder,
        routing: order.routing,
      })
    }
  })

  return result
}

/**
 * Fetches encoded order data for limit orders that are missing it locally from limit-orders endpoint.
 * Uses the injected fetcher to retrieve order data from endpoint.
 * Returns only entries corresponding to the provided orders array.
 */
export async function fetchLimitOrdersEncodedOrderData(
  orders: UniswapXOrderDetails[],
  limitOrdersFetcher?: LimitOrdersFetcher,
): Promise<Array<OrderWithEncodedData>> {
  // Early return if no fetcher provided or no orders
  if (!limitOrdersFetcher || orders.length === 0) {
    return []
  }

  // Filter orders that need encoded data
  const ordersNeedingEncodedData = orders.filter((order) => order.orderHash && !hasEncodedOrder(order))
  const missingEncodedOrderHashes = ordersNeedingEncodedData.map((order) => order.orderHash as string)

  if (missingEncodedOrderHashes.length === 0) {
    return []
  }

  try {
    // Fetch missing order data from API
    const limitOrderResponses = await limitOrdersFetcher(missingEncodedOrderHashes)
    const limitOrdersById = new Map(limitOrderResponses.map((o) => [o.orderHash, o]))

    // Build result array with fetched encoded data
    const fetched: Array<OrderWithEncodedData> = []
    for (const order of ordersNeedingEncodedData) {
      if (!order.orderHash) {
        continue
      }
      const limitOrder = limitOrdersById.get(order.orderHash)
      if (limitOrder?.encodedOrder) {
        fetched.push({
          orderHash: order.orderHash,
          encodedOrder: limitOrder.encodedOrder,
          routing: order.routing,
        })
      }
    }

    return fetched
  } catch (error) {
    logger.debug('cancelMultipleOrders', 'fetchLimitOrdersEncodedOrderData', 'Failed to fetch limit orders', {
      error,
      orderHashes: missingEncodedOrderHashes,
    })
    return []
  }
}

/**
 * Filters orders to only include those that can be cancelled
 * based on the available cancellation data
 */
export function getOrdersMatchingCancellationData(
  allOrders: UniswapXOrderDetails[],
  cancellationData: Array<{ orderHash: string }>,
): UniswapXOrderDetails[] {
  const cancellableHashes = new Set(cancellationData.map((order) => order.orderHash))
  return allOrders.filter((order) => order.orderHash && cancellableHashes.has(order.orderHash))
}

export async function getCancelMultipleUniswapXOrdersTransaction({
  orders,
  chainId,
  from,
}: {
  orders: Array<{ encodedOrder: string; routing: TradingApi.Routing }>
  chainId: UniverseChainId
  from: string
}): Promise<providers.TransactionRequest | undefined> {
  if (orders.length === 0) {
    return undefined
  }

  try {
    // Use factory function directly with chainId in each order
    const tx = await buildBatchCancellation(
      orders.map((order) => ({
        encodedOrder: order.encodedOrder,
        routing: order.routing,
        chainId,
      })),
      from,
    )

    // For gas estimation, only return the first transaction
    // Actual execution will handle all transactions
    if (Array.isArray(tx)) {
      return tx[0]
    }

    return tx ?? undefined
  } catch (error) {
    const wrappedError = new Error('could not populate cancel transaction', { cause: error })
    logger.debug('useCancelMultipleOrders', 'getCancelMultipleUniswapXOrdersTransaction', wrappedError.message, {
      error: wrappedError,
      orders,
    })
    return undefined
  }
}

export async function cancelMultipleUniswapXOrders({
  orders,
  chainId,
  signerAddress,
  provider,
}: {
  orders: Array<{ encodedOrder: string; routing: TradingApi.Routing }>
  chainId: UniverseChainId
  signerAddress?: string
  provider?: providers.Web3Provider
}): Promise<ContractTransaction[] | undefined> {
  if (!provider) {
    return undefined
  }

  // Early return if no signer address provided
  if (!signerAddress) {
    logger.warn('cancelMultipleOrders', 'cancelMultipleUniswapXOrders', 'No signer address provided', {
      orders,
      chainId,
    })
    return undefined
  }

  try {
    // Use factory function to create the cancellation transaction(s)
    const cancelTxOrTxs = await buildBatchCancellation(
      orders.map((order) => ({
        encodedOrder: order.encodedOrder,
        routing: order.routing,
        chainId,
      })),
      signerAddress,
    )

    if (!cancelTxOrTxs) {
      return undefined
    }

    // Handle both single transaction and array of transactions
    const txs = Array.isArray(cancelTxOrTxs) ? cancelTxOrTxs : [cancelTxOrTxs]

    // Execute using provider's signer directly
    const providerSigner = signerAddress ? provider.getSigner(signerAddress) : provider.getSigner()

    // Execute all transactions sequentially
    const sentTransactions: ContractTransaction[] = []
    for (const tx of txs) {
      const sentTx = await providerSigner.sendTransaction(tx)
      sentTransactions.push(sentTx)
    }

    return sentTransactions
  } catch (error) {
    logger.debug('useCancelMultipleOrders', 'cancelMultipleUniswapXOrders', 'Failed to cancel multiple orders', {
      error,
      orders,
    })
    return undefined
  }
}
