import { ChainId } from 'src/constants/chains'
import { MoonpayTransactionsResponse } from 'src/features/fiatOnRamp/types'
import { logException } from 'src/features/telemetry'
import { LogContext } from 'src/features/telemetry/constants'
import {
  FiatPurchaseTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { toSupportedChainId } from 'src/utils/chainId'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'

// TODO: determine what it should actually be across chains
const MOONPAY_FIAT_ON_RAMP_ADDRESS = '0xc216ed2d6c295579718dbd4a797845cda70b3c36'

function parseFiatPurchaseTransaction(
  transaction: Partial<MoonpayTransactionsResponse[0]>
): FiatPurchaseTransactionInfo & { chainId: ChainId } {
  const { currency: outputCurrency, getValidQuote } = transaction

  if (!outputCurrency) {
    throw new Error('Expected output currency to be defined.')
  }

  if (outputCurrency.type !== 'crypto') {
    throw new Error('Expected output currency to be crypto but received ' + outputCurrency.type)
  }

  const chainId = toSupportedChainId(outputCurrency.metadata.chainId ?? undefined)
  if (!chainId) {
    throw new Error('Unable to parse chain id' + outputCurrency.metadata.chainId)
  }

  const outputCurrencyId = outputCurrency.metadata.contractAddress
    ? buildCurrencyId(chainId, outputCurrency.metadata.contractAddress)
    : buildNativeCurrencyId(chainId)

  return {
    type: TransactionType.FiatPurchase,
    // NOTE: from docs it should be `returnUrl` but in test mode this is the right one
    explorerUrl: transaction.redirectUrl,
    outputCurrencyId,
    outputCurrencyAmountFormatted:
      getValidQuote?.quoteCurrencyAmount ?? transaction.quoteCurrencyAmount ?? 0,
    outputCurrencyAmountPrice:
      getValidQuote?.quoteCurrencyPrice ?? transaction.quoteCurrencyPrice ?? 0,
    chainId,
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

  // given that the `transaction` object is the raw Moonpay response,
  // we wrap the extract block in a try-catch and log to Sentry
  try {
    const { chainId, ...typeInfo } = parseFiatPurchaseTransaction(transaction) ?? {
      type: TransactionType.Unknown,
    }

    return {
      id: transaction.externalTransactionId,
      chainId,
      hash: transaction.id,
      addedTime: new Date(transaction.createdAt).getTime(),
      status: moonpayStatusToTransactionInfoStatus(transaction.status),
      from: MOONPAY_FIAT_ON_RAMP_ADDRESS,
      typeInfo,
      options: { request: {} },
    }
  } catch (e) {
    logException(LogContext.FiatOnRamp, `Failed to parse transaction: ${e}`)
    return null
  }
}
