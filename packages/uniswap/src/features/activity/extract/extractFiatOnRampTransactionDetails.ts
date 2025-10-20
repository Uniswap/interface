import { GraphQLApi, TradingApi } from '@universe/api'
import parseGraphQLOnRampTransaction from 'uniswap/src/features/activity/parse/parseOnRampTransaction'
import { remoteTxStatusToLocalTxStatus } from 'uniswap/src/features/activity/utils/remote'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import type { FORTransaction, FORTransactionDetails } from 'uniswap/src/features/fiatOnRamp/types'
import type {
  OffRampSaleInfo,
  OnRampPurchaseInfo,
  OnRampTransactionInfo,
  OnRampTransferInfo,
  TransactionDetails,
  TransactionListQueryResponse,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  TransactionDetailsType,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'

function parseFORTransaction(
  transaction: FORTransaction,
  isOffRamp: boolean,
): OnRampPurchaseInfo | OnRampTransferInfo | OffRampSaleInfo {
  const transactionInfo: OnRampTransactionInfo = {
    type: isOffRamp ? TransactionType.OffRampSale : TransactionType.OnRampPurchase,
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
    providerTransactionId: transaction.id,
  }

  const typeInfo: OnRampPurchaseInfo | OnRampTransferInfo | OffRampSaleInfo =
    transaction.sourceCurrencyCode === transaction.destinationCurrencyCode
      ? {
          ...transactionInfo,
          type: TransactionType.OnRampTransfer,
        }
      : {
          ...transactionInfo,
          type: isOffRamp ? TransactionType.OffRampSale : TransactionType.OnRampPurchase,
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

export function extractFORTransactionDetails({
  transaction,
  isOffRamp,
  activeAccountAddress,
}: {
  transaction: FORTransaction
  isOffRamp: boolean
  activeAccountAddress: Address | null
}): FORTransactionDetails | undefined {
  try {
    const chainId = toSupportedChainId(transaction.cryptoDetails.chainId)
    if (!chainId) {
      throw new Error('Unable to parse chain id ' + transaction.cryptoDetails.chainId)
    }

    const typeInfo = parseFORTransaction(transaction, isOffRamp)

    return {
      routing: TradingApi.Routing.CLASSIC,
      id: transaction.externalSessionId,
      chainId,
      hash: isOffRamp ? '' : transaction.cryptoDetails.blockchainTransactionId || '', // Don't merge offramp transactions
      addedTime: new Date(transaction.createdAt).getTime(),
      status: statusToTransactionInfoStatus(transaction.status),
      from: isOffRamp ? activeAccountAddress : transaction.cryptoDetails.walletAddress,
      typeInfo,
      options: { request: {} },
      transactionOriginType: TransactionOriginType.Internal,
    } as FORTransactionDetails
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

// TODO: WALL-5532 - Add support for offramp transactions on the graphql service
export function extractOnRampTransactionDetails(transaction: TransactionListQueryResponse): TransactionDetails | null {
  if (transaction?.details.__typename !== TransactionDetailsType.OnRamp) {
    return null
  }

  const typeInfo = parseGraphQLOnRampTransaction(transaction)

  if (!typeInfo) {
    return null
  }

  return {
    routing: TradingApi.Routing.CLASSIC,
    id: transaction.details.onRampTransfer.externalSessionId,
    // TODO: WALL-4919: Remove hardcoded Mainnet
    chainId: fromGraphQLChain(transaction.chain) ?? UniverseChainId.Mainnet,
    addedTime: transaction.timestamp * 1000, // convert to ms,
    status: remoteTxStatusToLocalTxStatus(GraphQLApi.TransactionType.OnRamp, transaction.details.status),
    from: transaction.details.receiverAddress, // This transaction is not on-chain, so use the receiver address as the from address
    typeInfo,
    options: { request: {} },
    transactionOriginType: TransactionOriginType.Internal,
  }
}
