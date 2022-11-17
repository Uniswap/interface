import { ChainId } from 'src/constants/chains'
import { MoonpayTransactionsResponse } from 'src/features/fiatOnRamp/types'
import {
  FiatPurchaseTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { toSupportedChainId } from 'src/utils/chainId'
import { buildNativeCurrencyId, currencyIdToChain } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'

// TODO: determine what it should actually be across chains
const MOONPAY_FIAT_ON_RAMP_ADDRESS = '0xc216ed2d6c295579718dbd4a797845cda70b3c36'

function parseFiatPurchaseTransaction(
  transaction: Partial<MoonpayTransactionsResponse[0]>
): FiatPurchaseTransactionInfo | undefined {
  const { currency: outputCurrency, getValidQuote } = transaction
  if (!outputCurrency) return undefined

  const chainId = toSupportedChainId(outputCurrency.metadata.chainId ?? undefined)

  if (
    outputCurrency.type !== 'crypto' ||
    // TODO: consider a better treatment of chain id unavailable
    !chainId
  ) {
    return
  }

  return {
    type: TransactionType.FiatPurchase,
    // TODO(judo): support non-native currencies by checking contract address
    outputCurrencyId: buildNativeCurrencyId(chainId),
    outputCurrencyAmountFormatted:
      getValidQuote?.quoteCurrencyAmount ?? transaction.quoteCurrencyAmount ?? 0,
    outputCurrencyAmountPrice:
      getValidQuote?.quoteCurrencyPrice ?? transaction.quoteCurrencyPrice ?? 0,
  }
}

function moonpayStatusToTransactionInfoStatus(
  status: MoonpayTransactionsResponse[0]['status']
): TransactionStatus {
  switch (status) {
    case 'failed':
      return TransactionStatus.Failed
    case 'pending':
    case 'waitingAuthorization':
    case 'waitingPayment':
      return TransactionStatus.Pending
    case 'completed':
      // completed fiat onramp transactions show up in on-chain history
      logger.warn(
        'extractFiatPurchaseTransactinDetails',
        'moonypayStatusToTransactionInfoStatus',
        'Expected every `completed` fiat onramp transactions to be filtered out.'
      )
      return TransactionStatus.Success
  }
}

export function extractFiatOnRampTransactionDetails(
  transaction: MoonpayTransactionsResponse[0]
): TransactionDetails | null {
  if (!transaction) return null

  const typeInfo = parseFiatPurchaseTransaction(transaction) ?? { type: TransactionType.Unknown }

  return {
    id: transaction.externalTransactionId,
    chainId:
      currencyIdToChain((typeInfo as FiatPurchaseTransactionInfo).outputCurrencyId) ??
      ChainId.Mainnet,
    hash: transaction.id,
    addedTime: new Date(transaction.createdAt).getTime(),
    status: moonpayStatusToTransactionInfoStatus(transaction.status),
    from: MOONPAY_FIAT_ON_RAMP_ADDRESS,
    typeInfo,
    options: { request: {} },
  }
}
