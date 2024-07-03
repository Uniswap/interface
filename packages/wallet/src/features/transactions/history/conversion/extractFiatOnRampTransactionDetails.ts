import { TransactionType as RemoteTransactionType } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { fromGraphQLChain, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { FORTransaction } from 'uniswap/src/features/fiatOnRamp/types'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'
import { Routing } from 'wallet/src/data/tradingApi/__generated__/index'
import { FiatOnRampTransactionDetails } from 'wallet/src/features/fiatOnRamp/types'
import parseOnRampTransaction from 'wallet/src/features/transactions/history/conversion/parseOnRampTransaction'
import { remoteTxStatusToLocalTxStatus } from 'wallet/src/features/transactions/history/utils'
import {
  FiatPurchaseTransactionInfo,
  TransactionDetails,
  TransactionDetailsType,
  TransactionListQueryResponse,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'

function parseFiatPurchaseTransaction(
  transaction: FORTransaction,
): FiatPurchaseTransactionInfo & { chainId: WalletChainId } {
  const {
    sourceAmount: inputCurrencyAmount,
    sourceCurrencyCode: inputCurrency,
    destinationCurrencyCode: outputCurrency,
    destinationAmount: outputCurrencyAmount,
    cryptoDetails,
    serviceProvider,
  } = transaction

  const chainId = toSupportedChainId(cryptoDetails?.chainId)
  if (!chainId) {
    throw new Error('Unable to parse chain id ' + cryptoDetails?.chainId)
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
    serviceProvider,
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
  transaction: FORTransaction,
): FiatOnRampTransactionDetails | undefined {
  try {
    const { chainId, ...typeInfo } = parseFiatPurchaseTransaction(transaction) ?? {
      type: TransactionType.Unknown,
    }

    return {
      routing: Routing.CLASSIC,
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

export function extractOnRampTransactionDetails(transaction: TransactionListQueryResponse): TransactionDetails | null {
  if (transaction?.details.__typename !== TransactionDetailsType.OnRamp) {
    return null
  }

  const typeInfo = parseOnRampTransaction(transaction)

  if (!typeInfo) {
    return null
  }

  return {
    routing: Routing.CLASSIC,
    id: transaction.details.id,
    chainId: fromGraphQLChain(transaction.chain) ?? UniverseChainId.Mainnet,
    addedTime: transaction.timestamp * 1000, // convert to ms,
    status: remoteTxStatusToLocalTxStatus(RemoteTransactionType.OnRamp, transaction.details.status),
    from: transaction.details.receiverAddress, // This transaction is not on-chain, so use the receiver address as the from address
    typeInfo,
    options: { request: {} },
  }
}
