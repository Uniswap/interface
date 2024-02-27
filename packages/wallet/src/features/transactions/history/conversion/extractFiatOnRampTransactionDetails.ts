import { logger } from 'utilities/src/logger/logger'
import { ChainId } from 'wallet/src/constants/chains'
import { toSupportedChainId } from 'wallet/src/features/chains/utils'
import { FORTransaction, FiatOnRampTransactionDetails } from 'wallet/src/features/fiatOnRamp/types'
import {
  FiatPurchaseTransactionInfo,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'

function parseFiatPurchaseTransaction(
  transaction: FORTransaction
): FiatPurchaseTransactionInfo & { chainId: ChainId } {
  const {
    sourceAmount: inputCurrencyAmount,
    sourceCurrencyCode: inputCurrency,
    destinationCurrencyCode: outputCurrency,
    destinationAmount: outputCurrencyAmount,
    cryptoDetails,
  } = transaction

  const chainId = toSupportedChainId(cryptoDetails?.chainId)
  if (!chainId) {
    throw new Error('Unable to parse chain id' + cryptoDetails?.chainId)
  }
  return {
    type: TransactionType.FiatPurchase,
    id: transaction.id,
    inputSymbol: inputCurrency,
    inputCurrencyAmount,
    outputSymbol: outputCurrency,
    outputCurrencyAmount,
    // mark this local tx as synced given we updated it with server information
    // this marks the tx as 'valid' / ready to display in the ui
    syncedWithBackend: true,
    chainId,
  }
}

function statusToTransactionInfoStatus(status: FORTransaction['status']): TransactionStatus {
  switch (status) {
    case 'FAILED':
    case 'ERROR':
    case 'VOIDED':
      return TransactionStatus.Failed
    case 'SETTLED':
      return TransactionStatus.Success
    default:
      return TransactionStatus.Pending
  }
}

export function extractFiatOnRampTransactionDetails(
  transaction: FORTransaction
): FiatOnRampTransactionDetails | undefined {
  try {
    const { chainId, ...typeInfo } = parseFiatPurchaseTransaction(transaction) ?? {
      type: TransactionType.Unknown,
    }

    return {
      id: transaction.externalSessionId,
      chainId,
      hash: transaction.cryptoDetails.blockchainTransactionId || '',
      addedTime: new Date(transaction.createdAt).getTime(),
      status: statusToTransactionInfoStatus(transaction.status),
      from: transaction.cryptoDetails.walletAddress,
      typeInfo,
      options: { request: {} },
    }
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'extractFiatPurchaseTransactionDetails',
        function: 'extractFiatOnRampTransactionDetails',
      },
    })
    return
  }
}
