import {
  UniswapXOrderType,
  UniswapXTransaction,
  UniswapXTransactionStatus,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'

import {
  TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

function mapUniswapXStatusToLocalTxStatus(status: UniswapXTransactionStatus): TransactionStatus {
  switch (status) {
    case UniswapXTransactionStatus.FILLED:
      return TransactionStatus.Success
    case UniswapXTransactionStatus.OPEN:
      return TransactionStatus.Pending
    case UniswapXTransactionStatus.CANCELLED:
      return TransactionStatus.Canceled
    case UniswapXTransactionStatus.ERROR:
    case UniswapXTransactionStatus.EXPIRED:
    case UniswapXTransactionStatus.INSUFFICIENT_FUNDS:
      return TransactionStatus.Failed
    default:
      return TransactionStatus.Unknown
  }
}

/**
 * Parse a Uniswap X transaction from the REST API
 */
export default function extractRestUniswapXOrderDetails(transaction: UniswapXTransaction): TransactionDetails | null {
  try {
    const {
      chainId,
      offerer,
      orderHash,
      timestampMillis,
      inputToken,
      inputTokenAmount,
      outputToken,
      outputTokenAmount,
      status,
      orderType,
    } = transaction

    if (!orderHash || !chainId || !inputToken || !outputToken) {
      return null
    }

    const inputCurrencyId = buildCurrencyId(chainId, inputToken.address)
    const outputCurrencyId = buildCurrencyId(chainId, outputToken.address)

    return {
      id: orderHash,
      // TODO(PORT-429): update to only TradingApi.Routing.DUTCH_V2 once limit orders can be excluded from REST query
      routing: orderType === UniswapXOrderType.LIMIT ? TradingApi.Routing.DUTCH_LIMIT : TradingApi.Routing.DUTCH_V2,
      chainId,
      orderHash,
      addedTime: Number(timestampMillis),
      status: mapUniswapXStatusToLocalTxStatus(status),
      from: offerer, // This transaction is not on-chain, so use the offerer address as the from address
      // TODO(PORT-429): remove special limit typeInfo once limit orders can be excluded from REST query
      typeInfo:
        orderType === UniswapXOrderType.LIMIT
          ? {
              type: TransactionType.Swap,
              tradeType: TradeType.EXACT_INPUT, // Limit orders are always exact input
              inputCurrencyId,
              outputCurrencyId,
              inputCurrencyAmountRaw: inputTokenAmount?.raw ?? '0',
              expectedOutputCurrencyAmountRaw: outputTokenAmount?.raw ?? '0',
              minimumOutputCurrencyAmountRaw: outputTokenAmount?.raw ?? '0', // For limit orders, expected and minimum are the same
            }
          : {
              type: TransactionType.Swap,
              inputCurrencyId,
              outputCurrencyId,
              inputCurrencyAmountRaw: inputTokenAmount?.raw ?? '0',
              outputCurrencyAmountRaw: outputTokenAmount?.raw ?? '0',
            },
      transactionOriginType: TransactionOriginType.Internal,
    }
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'extractRestUniswapXOrderDetails',
        function: 'extractRestUniswapXOrderDetails',
      },
    })
    return null
  }
}
