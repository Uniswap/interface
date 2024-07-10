import { permit2Address } from '@uniswap/permit2-sdk'
import { call, select } from 'typed-redux-saga'
import { FeatureFlags, getFeatureFlagName } from 'uniswap/src/features/gating/flags'
import { Statsig } from 'uniswap/src/features/gating/sdk/statsig'
import { RPCType } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'
import { Routing } from 'wallet/src/data/tradingApi/__generated__/index'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers'
import { ValidatedSwapTxContext } from 'wallet/src/features/transactions/contexts/SwapTxContext'
import { makeSelectAddressTransactions } from 'wallet/src/features/transactions/selectors'
import { sendTransaction } from 'wallet/src/features/transactions/sendTransactionSaga'
import { getBaseTradeAnalyticsProperties } from 'wallet/src/features/transactions/swap/analytics'
import { submitUniswapXOrder } from 'wallet/src/features/transactions/swap/submitOrderSaga'
import { isClassic } from 'wallet/src/features/transactions/swap/trade/utils'
import { tradeToTransactionInfo } from 'wallet/src/features/transactions/swap/utils'
import { wrap } from 'wallet/src/features/transactions/swap/wrapSaga'
import { ApproveTransactionInfo, TransactionStatus, TransactionType } from 'wallet/src/features/transactions/types'
import { SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { getProvider } from 'wallet/src/features/wallet/context'
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
    const { address } = account

    const chainId = swapTxContext.trade.inputAmount.currency.chainId

    // MEV protection is not needed for UniswapX approval and/or wrap transactions.
    const submitViaPrivateRpc = !isUniswapX && (yield* call(shouldSubmitViaPrivateRpc, chainId))
    let nonce = yield* call(getNonceForApproveAndSwap, address, chainId, submitViaPrivateRpc)

    // For classic swaps, trigger UI changes immediately after click
    if (!isUniswapX) {
      onSubmit()
    }

    let approveTxHash: string | undefined
    // Approval Logic
    if (approveTxRequest) {
      const typeInfo: ApproveTransactionInfo = {
        type: TransactionType.Approve,
        tokenAddress: approveTxRequest.to,
        spender: permit2Address(chainId),
      }

      const options = { request: approveTxRequest, submitViaPrivateRpc }
      const sendTransactionParams = { chainId, account, options, typeInfo, analytics }
      // TODO(WEB-4406) - Refactor the approval submission's rpc call latency to not delay wrap submission
      approveTxHash = (yield* call(sendTransaction, sendTransactionParams)).transactionResponse.hash
      nonce++
    }

    const typeInfo = tradeToTransactionInfo(swapTxContext.trade)
    // Swap Logic - UniswapX
    if (isUniswapX) {
      const { orderParams, wrapTxRequest } = swapTxContext

      let wrapTxHash: string | undefined
      // Wrap Logic - UniswapX Eth-input
      if (wrapTxRequest) {
        const inputCurrencyAmount = trade.inputAmount
        const wrapResponse = yield* wrap({ txRequest: { ...wrapTxRequest, nonce }, account, inputCurrencyAmount })
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
      const { txRequest: swapTxRequest } = swapTxContext
      const request = { ...swapTxRequest, nonce }
      const options = { request, submitViaPrivateRpc }
      const sendTransactionParams = { txId, chainId, account, options, typeInfo, analytics }
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

function* getNonceForApproveAndSwap(address: Address, chainId: number, submitViaPrivateRpc: boolean) {
  const rpcType = submitViaPrivateRpc ? RPCType.Private : RPCType.Public
  const provider = yield* call(getProvider, chainId, rpcType)
  const nonce = yield* call([provider, provider.getTransactionCount], address, 'pending')

  const pendingPrivateTransactionCount = yield* call(getPendingPrivateTxCount, address, chainId)
  if (rpcType !== RPCType.Private) {
    // only need to add the `pendingPrivateTransactionCount` when submitting via a public RPC
    // because it is unaware of pending txs in private pools
    return nonce + pendingPrivateTransactionCount
  }

  return nonce
}

function* shouldSubmitViaPrivateRpc(chainId: number) {
  const swapProtectionSetting = yield* select(selectWalletSwapProtectionSetting)
  const swapProtectionOn = swapProtectionSetting === SwapProtectionSetting.On
  const mevBlockerFeatureEnabled = Statsig.checkGate(getFeatureFlagName(FeatureFlags.MevBlocker))
  const privateRpcSupportedOnChain = chainId ? isPrivateRpcSupportedOnChain(chainId) : false
  return Boolean(swapProtectionOn && privateRpcSupportedOnChain && mevBlockerFeatureEnabled)
}

const selectAddressTransactions = makeSelectAddressTransactions()

function* getPendingPrivateTxCount(address: Address, chainId: number) {
  const pendingTransactions = yield* select(selectAddressTransactions, address)
  if (!pendingTransactions) {
    return 0
  }

  return pendingTransactions.filter(
    (tx) =>
      tx.chainId === chainId &&
      tx.status === TransactionStatus.Pending &&
      isClassic(tx) &&
      Boolean(tx.options.submitViaPrivateRpc),
  ).length
}
