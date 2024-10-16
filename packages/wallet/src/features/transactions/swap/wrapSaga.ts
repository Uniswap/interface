import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { providers } from 'ethers'
import { call, put } from 'typed-redux-saga'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import {
  GasFeeEstimates,
  TransactionOptions,
  TransactionOriginType,
  TransactionType,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { logger } from 'utilities/src/logger/logger'
import { sendTransaction } from 'wallet/src/features/transactions/sendTransactionSaga'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

export type WrapParams = {
  txId?: string
  // The id that will be used for the swap submitted after the wrap, if applicable.
  swapTxId?: string
  txRequest: providers.TransactionRequest
  account: AccountMeta
  inputCurrencyAmount: CurrencyAmount<Currency>
  skipPushNotification?: boolean
  gasEstimates?: GasFeeEstimates
}

export function* wrap(params: WrapParams) {
  try {
    const { account, inputCurrencyAmount, txRequest, txId, skipPushNotification, swapTxId, gasEstimates } = params
    let typeInfo: TransactionTypeInfo

    if (inputCurrencyAmount.currency.isNative) {
      typeInfo = {
        type: TransactionType.Wrap,
        unwrapped: false,
        currencyAmountRaw: inputCurrencyAmount.quotient.toString(),
        swapTxId,
        gasEstimates,
      }
    } else {
      typeInfo = {
        type: TransactionType.Wrap,
        unwrapped: true,
        currencyAmountRaw: inputCurrencyAmount.quotient.toString(),
        swapTxId,
        gasEstimates,
      }
    }

    const options: TransactionOptions = {
      request: txRequest,
    }

    const result = yield* call(sendTransaction, {
      txId,
      chainId: inputCurrencyAmount.currency.chainId,
      account,
      options,
      typeInfo,
      transactionOriginType: TransactionOriginType.Internal,
    })

    if (!skipPushNotification) {
      const wrapType = inputCurrencyAmount.currency.isNative ? WrapType.Wrap : WrapType.Unwrap
      yield* put(pushNotification({ type: AppNotificationType.SwapPending, wrapType }))
    }

    return result
  } catch (error) {
    logger.error(error, { tags: { file: 'wrapSaga', function: 'wrap' } })
    return undefined
  }
}

export const {
  name: tokenWrapSagaName,
  wrappedSaga: tokenWrapSaga,
  reducer: tokenWrapReducer,
  actions: tokenWrapActions,
} = createMonitoredSaga(wrap, 'wrap')
