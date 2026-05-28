import { BigNumber } from '@ethersproject/bignumber'
import {
  CosignedPriorityOrder,
  CosignedV2DutchOrder,
  CosignedV3DutchOrder,
  DutchOrder,
  getCancelMultipleParams,
  getCancelSingleParams,
} from '@uniswap/uniswapx-sdk'
import { TradingApi } from '@universe/api'
import { providers } from 'ethers/lib/ethers'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { createPermit2Contract } from 'uniswap/src/features/transactions/utils/permit2'
import { logger } from 'utilities/src/logger/logger'

const ROUTING_TO_ORDER_CLASS = {
  [TradingApi.Routing.DUTCH_V2]: CosignedV2DutchOrder,
  [TradingApi.Routing.DUTCH_V3]: CosignedV3DutchOrder,
  [TradingApi.Routing.PRIORITY]: CosignedPriorityOrder,
  [TradingApi.Routing.DUTCH_LIMIT]: DutchOrder,
} as const

export interface OrderCancellationParams {
  encodedOrder: string
  routing: TradingApi.Routing
  chainId: UniverseChainId
  orderHash?: string
}

/**
 * Builds a transaction to cancel a single UniswapX order
 */
export async function buildSingleCancellation(
  order: OrderCancellationParams,
  from: string,
): Promise<providers.TransactionRequest | null> {
  try {
    const nonce = extractNonceFromOrder(order)
    if (!nonce) {
      return null
    }

    const permit2 = createPermit2Contract()
    const cancelParams = getCancelSingleParams(nonce)
    const tx = await permit2.populateTransaction.invalidateUnorderedNonces(cancelParams.word, cancelParams.mask)

    return {
      ...tx,
      from,
      chainId: order.chainId,
    }
  } catch (error) {
    logger.debug('cancelOrderFactory', 'buildSingleCancellation', 'Failed to build single cancellation', {
      error,
      orderHash: order.orderHash,
    })
    return null
  }
}

/**
 * Builds transactions to cancel multiple UniswapX orders
 * Returns array of transactions when multiple word/mask pairs are needed
 */
export async function buildBatchCancellation(
  orders: OrderCancellationParams[],
  from: string,
): Promise<providers.TransactionRequest[] | providers.TransactionRequest | null> {
  if (orders.length === 0) {
    return null
  }

  try {
    // For a single order, use the more efficient single cancellation
    if (orders.length === 1) {
      const order = orders[0]
      if (!order) {
        return null
      }
      return buildSingleCancellation(order, from)
    }

    // All orders must be from the same chain for batch cancellation
    const chainId = orders[0]?.chainId
    if (!chainId || !orders.every((order) => order.chainId === chainId)) {
      logger.debug('cancelOrderFactory', 'buildBatchCancellation', 'All orders must be from the same chain')
      return null
    }

    // Extract nonces from all orders
    const nonces = orders
      .map((order) => extractNonceFromOrder(order))
      .filter((nonce): nonce is BigNumber => nonce !== null)

    if (nonces.length === 0) {
      logger.debug('cancelOrderFactory', 'buildBatchCancellation', 'No valid nonces found in orders')
      return null
    }

    // Get cancellation parameters for multiple nonces
    const cancelParams = getCancelMultipleParams(nonces)

    if (cancelParams.length === 0) {
      return null
    }

    const permit2 = createPermit2Contract()

    // Build transaction for each word/mask pair
    if (cancelParams.length === 1) {
      const param = cancelParams[0]
      if (!param) {
        return null
      }
      const tx = await permit2.populateTransaction.invalidateUnorderedNonces(param.word, param.mask)
      return {
        ...tx,
        from,
        chainId,
      }
    }

    // Multiple word/mask pairs require multiple transactions
    const transactions = await Promise.all(
      cancelParams.map(async (param) => {
        const tx = await permit2.populateTransaction.invalidateUnorderedNonces(param.word, param.mask)
        return {
          ...tx,
          from,
          chainId,
        }
      }),
    )

    return transactions
  } catch (error) {
    logger.debug('cancelOrderFactory', 'buildBatchCancellation', 'Failed to build batch cancellation', {
      error,
      orderCount: orders.length,
    })
    return null
  }
}

/**
 * Extracts the nonce from an encoded order based on its routing type
 */
function extractNonceFromOrder(order: OrderCancellationParams): BigNumber | null {
  try {
    const orderClass = ROUTING_TO_ORDER_CLASS[order.routing as keyof typeof ROUTING_TO_ORDER_CLASS]
    const parsedOrder = orderClass.parse(order.encodedOrder, order.chainId)
    return parsedOrder.info.nonce
  } catch (error) {
    logger.debug('cancelOrderFactory', 'extractNonceFromOrder', 'Failed to parse order', {
      error,
      orderHash: order.orderHash,
      routing: order.routing,
    })
    return null
  }
}
