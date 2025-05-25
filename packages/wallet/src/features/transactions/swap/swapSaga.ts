import { permit2Address } from '@uniswap/permit2-sdk'
import { call, put, select } from 'typed-redux-saga'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { getStatsigClient } from 'uniswap/src/features/gating/sdk/statsig'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { PermitMethod, ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { tradeToTransactionInfo } from 'uniswap/src/features/transactions/swap/utils/trade'
import {
  ApproveTransactionInfo,
  Permit2ApproveTransactionInfo,
  TransactionOptions,
  TransactionOriginType,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { logger } from 'utilities/src/logger/logger'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import {
  ExecuteTransactionParams,
  executeTransaction,
} from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { CalculatedNonce, tryGetNonce } from 'wallet/src/features/transactions/executeTransaction/tryGetNonce'
import {
  getShouldWaitBetweenTransactions,
  getSwapTransactionCount,
  waitForTransactionConfirmation,
} from 'wallet/src/features/transactions/swap/delegatedAccountUtils'
import { SubmitUniswapXOrderParams, submitUniswapXOrder } from 'wallet/src/features/transactions/swap/submitOrderSaga'
import { wrap } from 'wallet/src/features/transactions/swap/wrapSaga'
import { selectWalletSwapProtectionSetting } from 'wallet/src/features/wallet/selectors'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

export type SwapParams = {
  txId?: string
  account: SignerMnemonicAccountMeta
  analytics: SwapTradeBaseProperties
  swapTxContext: ValidatedSwapTxContext
  onSuccess: () => void
  onFailure: () => void
  onPending: () => void
}

export function* approveAndSwap(params: SwapParams) {
  const userSubmissionTimestampMs = Date.now()
  let calculatedNonce: CalculatedNonce | undefined
  try {
    const { swapTxContext, account, txId, analytics, onSuccess, onFailure, onPending } = params
    const { approveTxRequest } = swapTxContext
    const isUniswapXRouting = isUniswapX(swapTxContext)
    const isBridge = swapTxContext.routing === Routing.BRIDGE
    const chainId = swapTxContext.trade.inputAmount.currency.chainId

    // MEV protection is not needed for UniswapX approval and/or wrap transactions.
    // We disable for bridge to avoid any potential issues with BE checking status.
    const submitViaPrivateRpc = !isUniswapXRouting && !isBridge && (yield* call(shouldSubmitViaPrivateRpc, chainId))

    const shouldWait = yield* call(getShouldWaitBetweenTransactions, {
      swapper: account.address,
      chainId,
      privateRpcAvailable: submitViaPrivateRpc,
    })
    const swapTxHasDelayedSubmission = shouldWait && getSwapTransactionCount(swapTxContext) > 1

    if (isUniswapXRouting || swapTxHasDelayedSubmission) {
      yield* call(onPending)
    } else {
      yield* call(onSuccess)
    }

    // We must manually set the nonce when submitting multiple transactions in a row,
    // otherwise for some L2s the Provider might fetch the same nonce for both transactions.
    calculatedNonce = yield* call(tryGetNonce, account, chainId)
    let nonce = calculatedNonce?.nonce

    const gasFeeEstimation = swapTxContext.gasFeeEstimation

    let approveTxHash: string | undefined
    // Approval Logic
    if (approveTxRequest) {
      const typeInfo: ApproveTransactionInfo = {
        type: TransactionType.Approve,
        tokenAddress: approveTxRequest.to,
        spender: permit2Address(chainId),
        swapTxId: txId,
        gasEstimates: gasFeeEstimation?.approvalEstimates,
      }
      const options: TransactionOptions = {
        request: { ...approveTxRequest, nonce },
        submitViaPrivateRpc,
        userSubmissionTimestampMs,
      }
      const executeTransactionParams: ExecuteTransactionParams = {
        chainId,
        account,
        options,
        typeInfo,
        analytics,
        transactionOriginType: TransactionOriginType.Internal,
      }

      // TODO(WEB-4406) - Refactor the approval submission's rpc call latency to not delay wrap submission
      approveTxHash = (yield* call(executeTransaction, executeTransactionParams)).transactionResponse.hash
      nonce = nonce ? nonce + 1 : undefined

      yield* call(handleTransactionSpacing, { shouldWait, hash: approveTxHash, onFailure })
    }

    // Permit transaction logic (smart account mismatch case)
    if (swapTxContext.routing === Routing.CLASSIC && swapTxContext.permit?.method === PermitMethod.Transaction) {
      const permitTxRequest = swapTxContext.permit.txRequest

      // Spender should be routing contract, called in the swap tx
      const spender = swapTxContext.txRequests?.[0]?.to ?? ''

      const typeInfo: Permit2ApproveTransactionInfo = {
        type: TransactionType.Permit2Approve,
        spender,
      }
      const options: TransactionOptions = {
        request: { ...permitTxRequest, nonce },
        submitViaPrivateRpc,
        userSubmissionTimestampMs,
      }
      const executeTransactionParams: ExecuteTransactionParams = {
        chainId,
        account,
        options,
        typeInfo,
        analytics,
        transactionOriginType: TransactionOriginType.Internal,
      }

      const permitTxHash = (yield* call(executeTransaction, executeTransactionParams)).transactionResponse.hash
      nonce = nonce ? nonce + 1 : undefined

      yield* call(handleTransactionSpacing, { shouldWait, hash: permitTxHash, onFailure })
    }

    // Default to input for USD volume amount
    const transactedUSDValue = analytics.token_in_amount_usd

    const typeInfo = tradeToTransactionInfo(swapTxContext.trade, transactedUSDValue, gasFeeEstimation?.swapEstimates)

    // TODO(WEB-7432) - Remove UniswapX wrap logic, as ETH-input UniswapX is a dead flow / disabled by backend.
    // Swap Logic - UniswapX
    if (isUniswapXRouting) {
      const { trade, wrapTxRequest, permit } = swapTxContext
      const { quote } = trade.quote

      let wrapTxHash: string | undefined
      // Wrap Logic - UniswapX Eth-input
      if (wrapTxRequest) {
        const inputCurrencyAmount = trade.inputAmount
        const wrapResponse = yield* wrap({
          txRequest: { ...wrapTxRequest, nonce },
          account,
          inputCurrencyAmount,
          swapTxId: txId,
          skipPushNotification: true, // wrap is abstracted away in UX; we avoid showing a wrap notification
          gasEstimates: gasFeeEstimation?.wrapEstimates,
        })
        wrapTxHash = wrapResponse?.transactionResponse.hash
      }

      const submitOrderParams: SubmitUniswapXOrderParams = {
        account,
        analytics,
        approveTxHash,
        wrapTxHash,
        permit: permit.typedData,
        quote,
        routing: swapTxContext.routing,
        typeInfo,
        chainId,
        txId,
        onSuccess,
        onFailure,
      }
      yield* call(submitUniswapXOrder, submitOrderParams)
    } else if (swapTxContext.routing === Routing.BRIDGE) {
      const options: TransactionOptions = {
        request: { ...swapTxContext.txRequests?.[0], nonce },
        submitViaPrivateRpc,
        userSubmissionTimestampMs,
      }
      const executeTransactionParams: ExecuteTransactionParams = {
        txId,
        chainId,
        account,
        options,
        typeInfo,
        analytics,
        transactionOriginType: TransactionOriginType.Internal,
      }
      yield* call(executeTransaction, executeTransactionParams)
      yield* put(pushNotification({ type: AppNotificationType.SwapPending, wrapType: WrapType.NotApplicable }))

      // Call onSuccess now if it wasn't called earlier in function due to transaction spacing
      if (swapTxHasDelayedSubmission) {
        yield* call(onSuccess)
      }
    } else if (swapTxContext.routing === Routing.CLASSIC) {
      const options: TransactionOptions = {
        request: { ...swapTxContext.txRequests?.[0], nonce },
        submitViaPrivateRpc,
        userSubmissionTimestampMs,
      }
      const executeTransactionParams: ExecuteTransactionParams = {
        txId,
        chainId,
        account,
        options,
        typeInfo,
        analytics,
        transactionOriginType: TransactionOriginType.Internal,
      }
      yield* call(executeTransaction, executeTransactionParams)
      yield* put(pushNotification({ type: AppNotificationType.SwapPending, wrapType: WrapType.NotApplicable }))

      // Call onSuccess now if it wasn't called earlier in function due to transaction spacing
      if (swapTxHasDelayedSubmission) {
        yield* call(onSuccess)
      }
    }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'swapSaga', function: 'approveAndSwap' },
      extra: { analytics: params.analytics, calculatedNonce },
    })
  }
}

export const {
  name: swapSagaName,
  wrappedSaga: swapSaga,
  reducer: swapReducer,
  actions: swapActions,
} = createMonitoredSaga(approveAndSwap, 'swap')

export function* shouldSubmitViaPrivateRpc(chainId: number) {
  const swapProtectionSetting = yield* select(selectWalletSwapProtectionSetting)
  const swapProtectionOn = swapProtectionSetting === SwapProtectionSetting.On
  const privateRpcFeatureEnabled = getStatsigClient().checkGate(getFeatureFlagName(FeatureFlags.PrivateRpc))
  const privateRpcSupportedOnChain = chainId ? isPrivateRpcSupportedOnChain(chainId) : false
  return Boolean(swapProtectionOn && privateRpcSupportedOnChain && privateRpcFeatureEnabled)
}

/** Returns after the transactions corresponding to the given hash returns. Calls onFailure and throws an error if the transaction does not succeed. */
export function* handleTransactionSpacing(params: { shouldWait: boolean; hash: string; onFailure: () => void }) {
  const { shouldWait, hash } = params

  if (!shouldWait) {
    return
  }

  const throwOnFailure = () => {
    // Call back to UI
    params.onFailure()

    // Throw error to prevent saga from continuing
    throw new Error('Wait failed in swapSaga')
  }

  yield* call(waitForTransactionConfirmation, { hash, onFailure: throwOnFailure })
}
