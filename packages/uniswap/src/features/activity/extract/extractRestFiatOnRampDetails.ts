import { FiatOnRampTransaction, FiatOnRampTransactionStatus } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { TradingApi } from '@universe/api'

import { parseRestOnRampTransaction } from 'uniswap/src/features/activity/parse/parseOnRampTransaction'
import {
  TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'

function mapFiatOnRampStatusToLocalTxStatus(status: FiatOnRampTransactionStatus): TransactionStatus {
  switch (status) {
    case FiatOnRampTransactionStatus.SETTLED:
      return TransactionStatus.Success
    case FiatOnRampTransactionStatus.PENDING:
      return TransactionStatus.Pending
    case FiatOnRampTransactionStatus.FAILED:
      return TransactionStatus.Failed
    default:
      return TransactionStatus.Unknown
  }
}

/**
 * Parse a FOR transaction from the REST API
 * TODO(WALL-5532): add support for offramp transactions
 */
export default function extractRestFiatOnRampDetails(transaction: FiatOnRampTransaction): TransactionDetails | null {
  try {
    const {
      chainId,
      walletAddress,
      externalSessionId,
      timestampMillis,
      token,
      serviceProvider,
      transactionFee,
      status,
      transactionHash,
    } = transaction

    if (!externalSessionId || !chainId || !token || !serviceProvider) {
      return null
    }

    const typeInfo = parseRestOnRampTransaction(transaction)

    if (!typeInfo) {
      return null
    }

    const networkFee = transactionFee
      ? {
          quantity: String(transactionFee.amount?.amount),
          tokenSymbol: transactionFee.symbol,
          tokenAddress: transactionFee.address,
          chainId,
        }
      : undefined

    return {
      routing: TradingApi.Routing.CLASSIC,
      hash: transactionHash,
      id: externalSessionId,
      chainId,
      addedTime: Number(timestampMillis),
      status: mapFiatOnRampStatusToLocalTxStatus(status),
      from: walletAddress,
      typeInfo,
      options: { request: {} },
      transactionOriginType: TransactionOriginType.Internal,
      networkFee,
    }
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'extractRestFiatOnRampDetails',
        function: 'extractRestFiatOnRampDetails',
      },
    })
    return null
  }
}
