import { providers } from 'ethers'
import { Statsig } from 'statsig-react-native'
import { call, select } from 'typed-redux-saga'
import { isWeb } from 'ui/src'
import { logger } from 'utilities/src/logger/logger'
import { RPCType } from 'wallet/src/constants/chains'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers'
import { makeSelectAddressTransactions } from 'wallet/src/features/transactions/selectors'
import {
  SendTransactionParams,
  sendTransaction,
} from 'wallet/src/features/transactions/sendTransactionSaga'
import { getBaseTradeAnalyticsProperties } from 'wallet/src/features/transactions/swap/analytics'
import { tradeToTransactionInfo } from 'wallet/src/features/transactions/swap/utils'
import {
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
} from 'wallet/src/features/transactions/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { getProvider } from 'wallet/src/features/wallet/context'
import { selectWalletSwapProtectionSetting } from 'wallet/src/features/wallet/selectors'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

export type SwapParams = {
  txId?: string
  account: Account
  analytics: ReturnType<typeof getBaseTradeAnalyticsProperties>
  approveTxRequest?: providers.TransactionRequest
  swapTxRequest: providers.TransactionRequest
  swapTypeInfo: ReturnType<typeof tradeToTransactionInfo>
}

export function* approveAndSwap(params: SwapParams) {
  try {
    const { account, approveTxRequest, swapTxRequest, txId, analytics, swapTypeInfo } = params
    if (!swapTxRequest.chainId || !swapTxRequest.to || (approveTxRequest && !approveTxRequest.to)) {
      throw new Error('approveAndSwap received incomplete transaction request details')
    }
    const { chainId } = swapTxRequest
    const submitViaPrivateRpc = yield* call(shouldSubmitViaPrivateRpc, chainId)
    const nonce = yield* call(
      getNonceForApproveAndSwap,
      account.address,
      chainId,
      submitViaPrivateRpc
    )

    if (approveTxRequest && approveTxRequest.to) {
      const typeInfo: TransactionTypeInfo = {
        type: TransactionType.Approve,
        tokenAddress: approveTxRequest.to,
        spender: swapTxRequest.to,
      }

      const sendTransactionParams: SendTransactionParams = {
        chainId,
        account,
        options: { request: approveTxRequest, submitViaPrivateRpc },
        typeInfo,
        analytics,
      }

      yield* call(sendTransaction, sendTransactionParams)
    }

    const request = {
      ...swapTxRequest,
      nonce: approveTxRequest ? nonce + 1 : undefined,
    }

    const sendTransactionParams: SendTransactionParams = {
      txId,
      chainId,
      account,
      options: { request, submitViaPrivateRpc },
      typeInfo: swapTypeInfo,
      analytics,
    }

    yield* call(sendTransaction, sendTransactionParams)
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

function* getNonceForApproveAndSwap(
  address: Address,
  chainId: number,
  submitViaPrivateRpc: boolean
) {
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
  // TODO(EXT-460): remove this once Statsig is set up in the Extension
  const mevBlockerFeatureEnabled = isWeb ? true : Statsig.checkGate(FEATURE_FLAGS.MevBlocker)
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
      Boolean(tx.options.submitViaPrivateRpc)
  ).length
}
