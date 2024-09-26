import { permit2Address } from '@uniswap/permit2-sdk'
import { call, put, select } from 'typed-redux-saga'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { Statsig } from 'uniswap/src/features/gating/sdk/statsig'
import { getBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import { ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { TransactionStep } from 'uniswap/src/features/transactions/swap/utils/generateSwapSteps'
import { tradeToTransactionInfo } from 'uniswap/src/features/transactions/swap/utils/trade'
import {
  ApproveTransactionInfo,
  TransactionOriginType,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { logger } from 'utilities/src/logger/logger'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import { sendTransaction, tryGetNonce } from 'wallet/src/features/transactions/sendTransactionSaga'
import { submitUniswapXOrder } from 'wallet/src/features/transactions/swap/submitOrderSaga'
import { wrap } from 'wallet/src/features/transactions/swap/wrapSaga'
import { selectWalletSwapProtectionSetting } from 'wallet/src/features/wallet/selectors'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

export type SwapParams = {
  txId?: string
  account: SignerMnemonicAccountMeta
  analytics: ReturnType<typeof getBaseTradeAnalyticsProperties>
  swapTxContext: ValidatedSwapTxContext
  steps: TransactionStep[]
  onSubmit: () => void
  onFailure: () => void
}

export function* approveAndSwap(params: SwapParams) {
  try {
    const { swapTxContext, account, txId, analytics, onSubmit, onFailure } = params
    const { trade, routing, approveTxRequest } = swapTxContext
    const isUniswapX = routing === Routing.DUTCH_V2

    const chainId = swapTxContext.trade.inputAmount.currency.chainId

    // For classic swaps, trigger UI changes immediately after click
    if (!isUniswapX) {
      // onSubmit does not need to be wrapped in yield* call() here, but doing so makes it easier to test call ordering in swapSaga.test.ts
      yield* call(onSubmit)
    }

    // MEV protection is not needed for UniswapX approval and/or wrap transactions.
    const submitViaPrivateRpc = !isUniswapX && (yield* call(shouldSubmitViaPrivateRpc, chainId))
    // We must manually set the nonce when submitting multiple transactions in a row,
    // otherwise for some L2s the Provider might fetch the same nonce for both transactions.
    let nonce = yield* call(tryGetNonce, account, chainId)

    const gasFeeEstimation = swapTxContext.routing === Routing.CLASSIC ? swapTxContext.gasFeeEstimation : undefined

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

      const options = { request: { ...approveTxRequest, nonce }, submitViaPrivateRpc }

      const sendTransactionParams = {
        chainId,
        account,
        options,
        typeInfo,
        analytics,
        transactionOriginType: TransactionOriginType.Internal,
      }

      // TODO(WEB-4406) - Refactor the approval submission's rpc call latency to not delay wrap submission
      approveTxHash = (yield* call(sendTransaction, sendTransactionParams)).transactionResponse.hash
      nonce = nonce ? nonce + 1 : undefined
    }

    // Default to input for USD volume amount
    const transactedUSDValue = analytics.token_in_amount_usd

    const typeInfo = tradeToTransactionInfo(swapTxContext.trade, transactedUSDValue, gasFeeEstimation?.swapEstimates)
    // Swap Logic - UniswapX
    if (isUniswapX) {
      const { orderParams, wrapTxRequest } = swapTxContext

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
        })
        wrapTxHash = wrapResponse?.transactionResponse.hash
      }

      const submitOrderParams = {
        txId,
        chainId,
        orderParams,
        approveTxHash,
        wrapTxHash,
        account,
        typeInfo,
        analytics,
        onSubmit,
        onFailure,
      }
      yield* call(submitUniswapXOrder, submitOrderParams)
    }
    // Swap Logic - Classic
    else {
      const options = { request: { ...swapTxContext.txRequest, nonce }, submitViaPrivateRpc }
      const sendTransactionParams = {
        txId,
        chainId,
        account,
        options,
        typeInfo,
        analytics,
        transactionOriginType: TransactionOriginType.Internal,
      }
      yield* call(sendTransaction, sendTransactionParams)
      yield* put(pushNotification({ type: AppNotificationType.SwapPending, wrapType: WrapType.NotApplicable }))
    }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'swapSaga', function: 'approveAndSwap' },
      extra: { analytics: params.analytics },
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
  const privateRpcFeatureEnabled = Statsig.checkGate(getFeatureFlagName(FeatureFlags.PrivateRpc))
  const privateRpcSupportedOnChain = chainId ? isPrivateRpcSupportedOnChain(chainId) : false
  return Boolean(swapProtectionOn && privateRpcSupportedOnChain && privateRpcFeatureEnabled)
}
