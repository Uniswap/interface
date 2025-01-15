import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import {
  OnRampPurchaseInfo,
  OnRampTransactionInfo,
  OnRampTransferInfo,
  TransactionDetailsType,
  TransactionListQueryResponse,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getAddressFromAsset } from 'wallet/src/features/transactions/history/utils'

// TODO: WALL-5532 - Add support for offramp transactions on the graphql service
export default function parseOnRampTransaction(
  transaction: NonNullable<TransactionListQueryResponse>,
): OnRampPurchaseInfo | OnRampTransferInfo | undefined {
  let change
  if (transaction.details.__typename === TransactionDetailsType.Transaction) {
    change = transaction.details.assetChanges?.[0]
  } else if (transaction.details.__typename === TransactionDetailsType.OnRamp) {
    change = transaction.details.onRampTransfer
  } else {
    return undefined
  }

  if (change?.__typename !== 'OnRampTransfer') {
    return undefined
  }

  const tokenSymbol = change.token.symbol
  const tokenAddress = getAddressFromAsset({
    tokenStandard: change.tokenStandard,
    chain: change.token.chain,
    address: change.token.address,
  })

  const chainId = fromGraphQLChain(change.token.chain)

  if (!tokenSymbol || !tokenAddress || !chainId) {
    return undefined
  }

  const transactionInfo: OnRampTransactionInfo = {
    type: TransactionType.OnRampPurchase,
    id: change.transactionReferenceId,
    destinationTokenSymbol: tokenSymbol,
    destinationTokenAddress: tokenAddress,
    destinationTokenAmount: change.amount,
    serviceProvider: {
      id: change.serviceProvider.serviceProvider,
      name: change.serviceProvider.name,
      url: change.serviceProvider.url,
      logoLightUrl: change.serviceProvider.logoLightUrl,
      logoDarkUrl: change.serviceProvider.logoDarkUrl,
      supportUrl: change.serviceProvider.supportUrl,
    },
    networkFee: change.networkFee,
    transactionFee: change.transactionFee,
    totalFee: change.totalFee,
  }

  const typeInfo: OnRampPurchaseInfo | OnRampTransferInfo =
    change.sourceCurrency && change.sourceAmount
      ? {
          ...transactionInfo,
          type: TransactionType.OnRampPurchase,
          sourceCurrency: change.sourceCurrency,
          sourceAmount: change.sourceAmount,
        }
      : {
          ...transactionInfo,
          type: TransactionType.OnRampTransfer,
        }
  return typeInfo
}
