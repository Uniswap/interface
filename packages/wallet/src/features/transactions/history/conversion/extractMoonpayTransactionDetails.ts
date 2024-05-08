import { logger } from 'utilities/src/logger/logger'
import { getNativeAddress } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { toSupportedChainId } from 'wallet/src/features/chains/utils'
import {
  FiatOnRampTransactionDetails,
  MoonpayTransactionsResponse,
} from 'wallet/src/features/fiatOnRamp/types'
import {
  FiatPurchaseTransactionInfo,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'

const MOONPAY_ETH_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'

function parseFiatPurchaseTransaction(
  transaction: Partial<MoonpayTransactionsResponse[0]>
): FiatPurchaseTransactionInfo & { chainId: ChainId } {
  const {
    currency: outputCurrency,
    baseCurrencyAmount: inputCurrencyAmount,
    baseCurrency: inputCurrency,
    quoteCurrencyAmount: outputCurrencyAmount,
  } = transaction

  if (!outputCurrency) {
    throw new Error('Expected output currency to be defined.')
  }
  if (!inputCurrency) {
    throw new Error('Expected input currency to be defined.')
  }
  if (!inputCurrencyAmount) {
    throw new Error('Expected inputCurrencyAmount to be defined')
  }
  if (outputCurrency.type !== 'crypto') {
    throw new Error('Expected output currency to be crypto but received ' + outputCurrency.type)
  }

  const moonpayChainId = outputCurrency.metadata?.chainId
  const chainId = toSupportedChainId(moonpayChainId ?? undefined)
  if (!chainId || !moonpayChainId) {
    throw new Error('Unable to parse chain id' + outputCurrency.metadata?.chainId)
  }

  const outputTokenAddress =
    outputCurrency.metadata?.contractAddress === MOONPAY_ETH_CONTRACT_ADDRESS
      ? getNativeAddress(chainId)
      : outputCurrency.metadata?.contractAddress
  if (!outputTokenAddress) {
    throw new Error('Expected output currency address to be defined')
  }

  return {
    type: TransactionType.FiatPurchase,
    id: transaction.id,
    explorerUrl: formatReturnUrl(transaction.returnUrl, transaction.id), // Moonpay's transaction tracker page
    inputCurrency: { type: inputCurrency.type, code: inputCurrency.code },
    inputCurrencyAmount,
    outputCurrency: {
      type: outputCurrency.type,
      metadata: { chainId: moonpayChainId, contractAddress: outputTokenAddress },
    },
    outputCurrencyAmount,
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

// MoonPay does not always (ever?) return the transaction id inside `returnUrl`
//  returnUrl": "https://buy-sandbox.moonpay.com/transaction_receipt
// This adds `transactionId` param if required
function formatReturnUrl(
  providedReturnUrl: string | undefined,
  id: string | undefined
): string | undefined {
  if (!providedReturnUrl || !id) {
    return
  }

  if (providedReturnUrl.includes('?transactionId=')) {
    return providedReturnUrl
  }

  // TODO: [MOB-233] improve formatting when MoonPay provides us with more info
  return `${providedReturnUrl}?transactionId=${id}`
}

export function extractMoonpayTransactionDetails(
  transaction?: MoonpayTransactionsResponse[0]
): FiatOnRampTransactionDetails | undefined {
  if (!transaction) {
    return
  }

  // given that the `transaction` object is the raw Moonpay response,
  // we wrap the extract block in a try-catch and log to Sentry
  try {
    const { chainId, ...typeInfo } = parseFiatPurchaseTransaction(transaction) ?? {
      type: TransactionType.Unknown,
    }

    return {
      id: transaction.externalTransactionId,
      chainId,
      hash: transaction.cryptoTransactionId,
      addedTime: new Date(transaction.createdAt).getTime(),
      status: moonpayStatusToTransactionInfoStatus(transaction.status),
      from: transaction.walletAddress,
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
