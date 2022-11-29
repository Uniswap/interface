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
import { getNativeCurrencyAddressForChain } from 'src/utils/currencyId'

const MOONPAY_ETH_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'

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

  const outputTokenAddress =
    outputCurrency.metadata.contractAddress === MOONPAY_ETH_CONTRACT_ADDRESS
      ? getNativeCurrencyAddressForChain(chainId)
      : outputCurrency.metadata.contractAddress

  return {
    type: TransactionType.FiatPurchase,
    explorerUrl: transaction.returnUrl, // Moonpay's transaction tracker page
    outputTokenAddress: outputTokenAddress,
    outputCurrencyAmountFormatted:
      getValidQuote?.quoteCurrencyAmount ?? transaction.quoteCurrencyAmount ?? 0,
    outputCurrencyAmountPrice:
      getValidQuote?.quoteCurrencyPrice ?? transaction.quoteCurrencyPrice ?? 0,
    // mark this local tx as synced given we updated it with server information
    // this marks the tx as 'valid' / ready to display in the ui
    syncedWithBackend: true,
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
      return TransactionStatus.Success
  }
}

export function extractFiatOnRampTransactionDetails(
  transaction: MoonpayTransactionsResponse[0]
): TransactionDetails | undefined {
  if (!transaction) return

  // given that the `transaction` object is the raw Moonpay response,
  // we wrap the extract block in a try-catch and log to Sentry
  try {
    const { chainId, ...typeInfo } = parseFiatPurchaseTransaction(transaction) ?? {
      type: TransactionType.Unknown,
    }

    return {
      id: transaction.externalTransactionId,
      chainId,
      hash: transaction.depositHash,
      addedTime: new Date(transaction.createdAt).getTime(),
      status: moonpayStatusToTransactionInfoStatus(transaction.status),
      from: transaction.walletAddress,
      typeInfo,
      options: { request: {} },
    }
  } catch (e) {
    logException(LogContext.FiatOnRamp, `Failed to parse transaction: ${e}`)
    return
  }
}
