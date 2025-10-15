import { Dispatch } from 'redux'
import { fetchOrdersWithoutIds } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { GetOrdersResponse, OrderStatus, OrderType, Routing } from 'uniswap/src/data/tradingApi/__generated__'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { transactionActions } from 'uniswap/src/features/transactions/slice'
import {
  QueuedOrderStatus,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { sleep } from 'utilities/src/time/timing'

function convertOrderTypeToRouting(
  routing: OrderType,
): Routing.DUTCH_LIMIT | Routing.DUTCH_V2 | Routing.DUTCH_V3 | Routing.PRIORITY {
  switch (routing) {
    case OrderType.PRIORITY:
      return Routing.PRIORITY
    case OrderType.DUTCH_V2:
      return Routing.DUTCH_V2
    case OrderType.DUTCH_V3:
      return Routing.DUTCH_V3
    case OrderType.DUTCH:
    case OrderType.DUTCH_LIMIT:
    default:
      return Routing.DUTCH_LIMIT
  }
}

function convertOrderStatusToTransactionStatus(status: OrderStatus): TransactionStatus {
  switch (status) {
    case OrderStatus.FILLED:
      return TransactionStatus.Success
    case OrderStatus.OPEN:
      return TransactionStatus.Pending
    case OrderStatus.EXPIRED:
      return TransactionStatus.Expired
    case OrderStatus.ERROR:
      return TransactionStatus.Failed
    case OrderStatus.CANCELLED:
      return TransactionStatus.Canceled
    case OrderStatus.INSUFFICIENT_FUNDS:
      return TransactionStatus.InsufficientFunds
    case OrderStatus.UNVERIFIED:
    default:
      return TransactionStatus.Unknown
  }
}

/**
 * Factory function that creates a handler for externally submitted UniswapX orders.
 * This pattern allows for better dependency injection and testability.
 */
export function createExternallySubmittedUniswapXOrder(ctx: {
  addTxToWatcher: (txDetails: UniswapXOrderDetails) => void
  fetchLatestOpenOrder: (address: string) => Promise<GetOrdersResponse>
  /**
   * Wait for the order to be submitted to the backend. In the case the order is not ready
   * the worst that will happen is the last order will be submitted to the transaction watcher
   * which will be ignored.
   */
  waitForOrder: (ms: number) => Promise<void>
}) {
  return async function (address: string): Promise<void> {
    await ctx.waitForOrder(ONE_SECOND_MS * 2)

    try {
      const res = await ctx.fetchLatestOpenOrder(address)
      const tx = res.orders[0]

      if (!tx) {
        // TODO consider a retry mechanism if we see this fail often. We would need a way to identify that the latest order is the one we submitted.
        return
      }

      if (!(typeof tx.chainId === 'number' && Object.values(UniverseChainId).includes(tx.chainId.toString()))) {
        logger.error(new Error(`Invalid UniverseChainId: ${tx.chainId}`), {
          tags: { file: 'handleExternallySubmittedUniswapXOrder', function: 'handleExternallySubmittedUniswapXOrder' },
        })
      }

      const universeChainId = tx.chainId as unknown as UniverseChainId

      const inputToken = tx.input
      const outputToken = tx.outputs?.[0]

      const transactionDetail: UniswapXOrderDetails = {
        routing: convertOrderTypeToRouting(tx.type),
        chainId: universeChainId,
        id: tx.orderId,
        from: address,
        typeInfo: {
          type: TransactionType.Swap,
          inputCurrencyId: buildCurrencyId(universeChainId, inputToken?.token ?? ''),
          outputCurrencyId: buildCurrencyId(universeChainId, outputToken?.token ?? ''),
          inputCurrencyAmountRaw: inputToken?.startAmount ?? '0',
          outputCurrencyAmountRaw: outputToken?.startAmount ?? '0',
          quoteId: tx.quoteId ?? '',
          tradeType: 0,
        },
        status: convertOrderStatusToTransactionStatus(tx.orderStatus),
        queueStatus: QueuedOrderStatus.Submitted,
        addedTime: Date.now(),
        orderHash: tx.orderId,
        transactionOriginType: TransactionOriginType.External,
      }
      ctx.addTxToWatcher(transactionDetail)
    } catch (error) {
      logger.error(error, {
        tags: { file: 'handleExternallySubmittedUniswapXOrder', function: 'handleExternallySubmittedUniswapXOrder' },
      })
    }
  }
}

/**
 * In the case of the extension, because the uniswapX order is not initiated by the
 * extension, we need to fetch the submitted order and then manually submit it to the
 * transaction watcher to update the status.
 **/
export const handleExternallySubmittedUniswapXOrder = (address: string, dispatch: Dispatch): Promise<void> =>
  createExternallySubmittedUniswapXOrder({
    addTxToWatcher: (txDetails) => dispatch(transactionActions.addTransaction(txDetails)),
    fetchLatestOpenOrder: (address) =>
      fetchOrdersWithoutIds({ swapper: address, limit: 1, orderStatus: OrderStatus.OPEN }),
    waitForOrder: async (ms: number = ONE_SECOND_MS * 2): Promise<void> => {
      await sleep(ms)
    },
  })(address)
