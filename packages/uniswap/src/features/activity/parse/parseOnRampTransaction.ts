import { FiatOnRampTransaction } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  OnRampPurchaseInfo,
  OnRampTransferInfo,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export function parseOnRampTransaction(
  transaction: FiatOnRampTransaction,
): OnRampPurchaseInfo | OnRampTransferInfo | undefined {
  const {
    externalSessionId,
    token,
    tokenAmount,
    fiatCurrency,
    fiatAmount,
    serviceProvider,
    totalFee,
    transactionReferenceId,
  } = transaction

  if (!externalSessionId || !token || !serviceProvider) {
    return undefined
  }

  const isTransfer = fiatCurrency === token.symbol

  const typeInfo: OnRampPurchaseInfo | OnRampTransferInfo = {
    type: isTransfer ? TransactionType.OnRampTransfer : TransactionType.OnRampPurchase,
    id: externalSessionId,
    sourceAmount: fiatAmount,
    sourceCurrency: fiatCurrency,
    destinationTokenAddress: token.address,
    destinationTokenAmount: tokenAmount?.amount,
    destinationTokenSymbol: token.symbol,
    serviceProvider: {
      id: serviceProvider.serviceProvider,
      name: serviceProvider.name,
      url: serviceProvider.url,
      logoLightUrl: serviceProvider.logoLightUrl,
      logoDarkUrl: serviceProvider.logoDarkUrl,
      supportUrl: serviceProvider.supportUrl,
    },
    totalFee,
    providerTransactionId: transactionReferenceId,
  }

  return typeInfo
}
