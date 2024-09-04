import { permit2Address } from '@uniswap/permit2-sdk'
import { call, select } from 'typed-redux-saga'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { Statsig } from 'uniswap/src/features/gating/sdk/statsig'
import {
  ApproveTransactionInfo,
  TransactionOriginType,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers'
import { ValidatedSwapTxContext } from 'wallet/src/features/transactions/contexts/SwapTxContext'
import { sendTransaction, tryGetNonce } from 'wallet/src/features/transactions/sendTransactionSaga'
import { getBaseTradeAnalyticsProperties } from 'wallet/src/features/transactions/swap/analytics'
import { submitUniswapXOrder } from 'wallet/src/features/transactions/swap/submitOrderSaga'
import { tradeToTransactionInfo } from 'wallet/src/features/transactions/swap/utils'
import { wrap } from 'wallet/src/features/transactions/swap/wrapSaga'
import { SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { selectWalletSwapProtectionSetting } from 'wallet/src/features/wallet/selectors'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

export type SwapParams = {
  txId?: string
  account: SignerMnemonicAccount
  analytics: ReturnType<typeof getBaseTradeAnalyticsProperties>
  swapTxContext: ValidatedSwapTxContext
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
        estimatedGasFeeDetails: gasFeeEstimation?.approvalFee,
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

    const typeInfo = tradeToTransactionInfo(swapTxContext.trade, transactedUSDValue, gasFeeEstimation?.swapFee)
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
} = createMonitoredSaga<SwapParams>(approveAndSwap, 'swap')

export function* shouldSubmitViaPrivateRpc(chainId: number) {
  const swapProtectionSetting = yield* select(selectWalletSwapProtectionSetting)
  const swapProtectionOn = swapProtectionSetting === SwapProtectionSetting.On
  const privateRpcFeatureEnabled = Statsig.checkGate(getFeatureFlagName(FeatureFlags.PrivateRpc))
  const privateRpcSupportedOnChain = chainId ? isPrivateRpcSupportedOnChain(chainId) : false
  return Boolean(swapProtectionOn && privateRpcSupportedOnChain && privateRpcFeatureEnabled)
}
