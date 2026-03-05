import { FORTransactionStatus, GraphQLApi, TradingApi } from '@universe/api'
import parseGraphQLOnRampTransaction from 'uniswap/src/features/activity/parse/parseOnRampTransaction'
import { remoteTxStatusToLocalTxStatus } from 'uniswap/src/features/activity/utils/remote'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import type { FORTransaction, FORTransactionDetails } from 'uniswap/src/features/fiatOnRamp/types'
import { isValidIsoCurrencyCode } from 'uniswap/src/features/fiatOnRamp/utils'
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
  const serviceProviderDetails = transaction.serviceProviderDetails
  const cryptoDetails = transaction.cryptoDetails

  const transactionInfo: OnRampTransactionInfo = {
    type: isOffRamp ? TransactionType.OffRampSale : TransactionType.OnRampPurchase,
    id: transaction.externalSessionId,
    destinationTokenSymbol: transaction.destinationCurrencyCode,
    destinationTokenAddress: transaction.destinationContractAddress,
    destinationTokenAmount: transaction.destinationAmount,
    serviceProvider: {
      id: serviceProviderDetails?.serviceProvider ?? '',
      name: serviceProviderDetails?.name ?? '',
      url: serviceProviderDetails?.url ?? '',
      logoLightUrl: serviceProviderDetails?.logos?.lightLogo ?? '',
      logoDarkUrl: serviceProviderDetails?.logos?.darkLogo ?? '',
      supportUrl: serviceProviderDetails?.supportUrl ?? '',
    },
    networkFee: cryptoDetails?.networkFee,
    transactionFee: cryptoDetails?.transactionFee,
    totalFee: cryptoDetails?.totalFee,
    providerTransactionId: transaction.id,
  }

  const isTransfer = transaction.sourceCurrencyCode === transaction.destinationCurrencyCode
  // Validate sourceCurrencyCode is a valid 3-letter ISO currency code
  const hasValidSourceCurrency = isValidIsoCurrencyCode(transaction.sourceCurrencyCode)

  // Only include sourceCurrency if it's valid and not a transfer
  if (!isTransfer && hasValidSourceCurrency) {
    return {
      ...transactionInfo,
      type: isOffRamp ? TransactionType.OffRampSale : TransactionType.OnRampPurchase,
      sourceCurrency: transaction.sourceCurrencyCode,
      sourceAmount: transaction.sourceAmount,
    }
  }

  // If it's a transfer (source === destination), return as OnRampTransfer regardless of isOffRamp
  // This preserves the original behavior where transfers are always typed as OnRampTransfer
  if (isTransfer) {
    return {
      ...transactionInfo,
      type: TransactionType.OnRampTransfer,
    }
  }

  // For off-ramp with invalid currency (not a transfer), log a warning and return with placeholder
  // Note: The formatter in OnRampTransferSummaryItem will also log an error for '-',
  // but we log here as well to capture the context at extraction time
  if (isOffRamp) {
    logger.warn(
      'extractFiatOnRampTransactionDetails',
      'parseFORTransaction',
      `Invalid sourceCurrencyCode for off-ramp transaction: ${transaction.sourceCurrencyCode}, transactionId: ${transaction.id}`,
    )
    return {
      ...transactionInfo,
      type: TransactionType.OffRampSale,
      sourceCurrency: '-',
      sourceAmount: transaction.sourceAmount,
    }
  }

  // For on-ramp with invalid sourceCurrencyCode, treat as transfer
  return {
    ...transactionInfo,
    type: TransactionType.OnRampTransfer,
  }
}

function statusToTransactionInfoStatus(status: FORTransaction['status']): TransactionStatus {
  switch (status) {
    case FORTransactionStatus.FAILED:
      return TransactionStatus.Failed
    case FORTransactionStatus.SETTLED:
      return TransactionStatus.Success
    case FORTransactionStatus.PENDING:
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
    const cryptoDetails = transaction.cryptoDetails
    const chainId = toSupportedChainId(cryptoDetails?.chainId ?? '')
    if (!chainId) {
      throw new Error('Unable to parse chain id ' + (cryptoDetails?.chainId ?? 'undefined'))
    }

    const typeInfo = parseFORTransaction(transaction, isOffRamp)

    return {
      routing: TradingApi.Routing.CLASSIC,
      id: transaction.externalSessionId,
      chainId,
      hash: isOffRamp ? '' : cryptoDetails?.blockchainTransactionId || '', // Don't merge offramp transactions
      addedTime: new Date(transaction.createdAt).getTime(),
      status: statusToTransactionInfoStatus(transaction.status),
      from: isOffRamp ? activeAccountAddress : cryptoDetails?.walletAddress,
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
