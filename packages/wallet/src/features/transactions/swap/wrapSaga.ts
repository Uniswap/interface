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
import { executeTransaction } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

export type WrapParams = {
  txId?: string
  // The id that will be used for the swap submitted after the wrap, if applicable.
  swapTxId?: string
  txRequest: providers.TransactionRequest
  account: AccountMeta
  // Serialized CurrencyAmount data
  inputCurrencyAmountRaw: string
  inputCurrencyId: string
  chainId: number
  skipPushNotification?: boolean
  gasEstimates?: GasFeeEstimates
  wrapType?: WrapType
}

export function* wrap(params: WrapParams) {
  try {
    const {
      account,
      inputCurrencyAmountRaw,
      chainId,
      txRequest,
      txId,
      skipPushNotification,
      swapTxId,
      gasEstimates,
      wrapType,
    } = params

    // Determine if this is a wrap or unwrap based on wrapType
    let isUnwrapped = false
    if (wrapType === WrapType.FewWrap || wrapType === WrapType.Wrap) {
      isUnwrapped = false
    } else if (wrapType === WrapType.FewUnwrap || wrapType === WrapType.Unwrap) {
      isUnwrapped = true
    } else {
      // Fallback: assume unwrap if wrapType is not provided
      isUnwrapped = true
    }

    const typeInfo: TransactionTypeInfo = {
      type: TransactionType.Wrap,
      unwrapped: isUnwrapped,
      currencyAmountRaw: inputCurrencyAmountRaw,
      swapTxId,
      gasEstimates,
    }

    // Note: Mobile/wallet wrapSaga currently doesn't support multi-step flows (approval + wrap)
    // For FewWrap with approval, the approval should be handled separately before calling wrap
    // TODO: Implement multi-step flow for mobile similar to web's wrapSaga

    const options: TransactionOptions = {
      request: txRequest,
    }

    const result = yield* call(executeTransaction, {
      txId,
      chainId,
      account,
      options,
      typeInfo,
      transactionOriginType: TransactionOriginType.Internal,
    })

    if (!skipPushNotification) {
      // Use provided wrapType, or default to Wrap
      const notificationWrapType = wrapType || WrapType.Wrap
      yield* put(pushNotification({ type: AppNotificationType.SwapPending, wrapType: notificationWrapType }))
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
