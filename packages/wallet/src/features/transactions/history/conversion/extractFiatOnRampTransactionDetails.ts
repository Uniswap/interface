import { TransactionType as RemoteTransactionType } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { fromGraphQLChain, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { FORTransaction, FiatOnRampTransactionDetails } from 'uniswap/src/features/fiatOnRamp/types'
import {
  OnRampPurchaseInfo,
  OnRampTransactionInfo,
  OnRampTransferInfo,
  TransactionDetails,
  TransactionDetailsType,
  TransactionListQueryResponse,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'
import parseGraphQLOnRampTransaction from 'wallet/src/features/transactions/history/conversion/parseOnRampTransaction'
import { remoteTxStatusToLocalTxStatus } from 'wallet/src/features/transactions/history/utils'

function parseOnRampTransaction(transaction: FORTransaction): OnRampPurchaseInfo | OnRampTransferInfo {
  const transactionInfo: OnRampTransactionInfo = {
    type: TransactionType.OnRampPurchase,
    id: transaction.externalSessionId,
    destinationTokenSymbol: transaction.destinationCurrencyCode,
    destinationTokenAddress: transaction.destinationContractAddress,
    destinationTokenAmount: transaction.destinationAmount,
    serviceProvider: {
      id: transaction.serviceProviderDetails.serviceProvider,
      name: transaction.serviceProviderDetails.name,
      url: transaction.serviceProviderDetails.url,
      logoLightUrl: transaction.serviceProviderDetails.logos.lightLogo,
      logoDarkUrl: transaction.serviceProviderDetails.logos.darkLogo,
      supportUrl: transaction.serviceProviderDetails.supportUrl,
    },
    networkFee: transaction.cryptoDetails.networkFee,
    transactionFee: transaction.cryptoDetails.transactionFee,
    totalFee: transaction.cryptoDetails.totalFee,
  }

  const typeInfo: OnRampPurchaseInfo | OnRampTransferInfo =
    transaction.sourceCurrencyCode === transaction.destinationCurrencyCode
      ? {
          ...transactionInfo,
          type: TransactionType.OnRampTransfer,
        }
      : {
          ...transactionInfo,
          type: TransactionType.OnRampPurchase,
          sourceCurrency: transaction.sourceCurrencyCode,
          sourceAmount: transaction.sourceAmount,
        }
  return typeInfo
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
    const chainId = toSupportedChainId(transaction.cryptoDetails.chainId)
    if (!chainId) {
      throw new Error('Unable to parse chain id ' + transaction.cryptoDetails.chainId)
    }

    const typeInfo = parseOnRampTransaction(transaction)

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
      transactionOriginType: TransactionOriginType.Internal,
    }
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'extractFiatPurchaseTransactionDetails',
        function: 'extractFiatOnRampTransactionDetails',
      },
    })
    return undefined
  }
}

export function extractOnRampTransactionDetails(transaction: TransactionListQueryResponse): TransactionDetails | null {
  if (transaction?.details.__typename !== TransactionDetailsType.OnRamp) {
    return null
  }

  const typeInfo = parseGraphQLOnRampTransaction(transaction)

  if (!typeInfo) {
    return null
  }

  return {
    routing: Routing.CLASSIC,
    id: transaction.details.onRampTransfer.externalSessionId,
    // TODO: WALL-4919: Remove hardcoded Mainnet
    chainId: fromGraphQLChain(transaction.chain) ?? UniverseChainId.Mainnet,
    addedTime: transaction.timestamp * 1000, // convert to ms,
    status: remoteTxStatusToLocalTxStatus(RemoteTransactionType.OnRamp, transaction.details.status),
    from: transaction.details.receiverAddress, // This transaction is not on-chain, so use the receiver address as the from address
    typeInfo,
    options: { request: {} },
    transactionOriginType: TransactionOriginType.Internal,
  }
}
