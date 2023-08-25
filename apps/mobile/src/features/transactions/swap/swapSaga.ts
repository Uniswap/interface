import { providers } from 'ethers'
import { tradeToTransactionInfo } from 'src/features/transactions/swap/utils'
import { Statsig } from 'statsig-react-native'
import { call, select } from 'typed-redux-saga'
import { serializeError } from 'utilities/src/errors'
import { logger } from 'utilities/src/logger/logger'
import { AlternativeRpcType, ChainId } from 'wallet/src/constants/chains'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { isAlternativeRpcSupportedOnChain } from 'wallet/src/features/providers'
import { makeSelectAddressTransactions } from 'wallet/src/features/transactions/selectors'
import { sendTransaction } from 'wallet/src/features/transactions/sendTransactionSaga'
import { Trade } from 'wallet/src/features/transactions/swap/useTrade'
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
  trade: Trade
  approveTxRequest?: providers.TransactionRequest
  swapTxRequest: providers.TransactionRequest
}

export function* approveAndSwap(params: SwapParams) {
  try {
    const { account, approveTxRequest, swapTxRequest, txId, trade } = params
    if (!swapTxRequest.chainId || !swapTxRequest.to || (approveTxRequest && !approveTxRequest.to)) {
      throw new Error('approveAndSwap received incomplete transaction request details')
    }
    const { chainId } = swapTxRequest
    const alternativeRpc = yield* call(maybeGetAlternativeRpc, chainId)
    const provider = yield* call(getProvider, chainId, alternativeRpc)
    const nonce = yield* call(
      getNonceForApproveAndSwap,
      provider,
      account.address,
      chainId,
      alternativeRpc
    )

    if (approveTxRequest && approveTxRequest.to) {
      const typeInfo: TransactionTypeInfo = {
        type: TransactionType.Approve,
        tokenAddress: approveTxRequest.to,
        spender: swapTxRequest.to,
      }

      yield* call(sendTransaction, {
        chainId,
        account,
        options: { request: approveTxRequest, alternativeRpc },
        typeInfo,
        trade,
      })
    }

    const request = {
      ...swapTxRequest,
      nonce: approveTxRequest ? nonce + 1 : undefined,
    }

    const swapTypeInfo = tradeToTransactionInfo(trade)

    yield* call(sendTransaction, {
      txId,
      chainId,
      account,
      options: { request, alternativeRpc },
      typeInfo: swapTypeInfo,
      trade,
    })
  } catch (error) {
    logger.error('Swap failed', {
      tags: {
        file: 'swapSaga',
        function: 'approveAndSwap',
        error: serializeError(error),
      },
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
  provider: providers.JsonRpcProvider,
  address: Address,
  chainId: number,
  alternativeRpc?: AlternativeRpcType
) {
  let nonce = yield* call([provider, provider.getTransactionCount], address, 'pending')

  // If on mainnet, but pending txns on private rpc, need to increment nonce by the amount of
  // pending transactions to submit correctly.
  const pendingPrivateTransactionCount = yield* call(getPendingPrivateTransactionCount, address)

  const shouldIncrementNonce = !alternativeRpc && chainId === ChainId.Mainnet
  if (shouldIncrementNonce) {
    nonce = nonce + pendingPrivateTransactionCount
  }

  return nonce
}

function* maybeGetAlternativeRpc(chainId: number) {
  const isMevBlockerFeatureEnabled = Statsig.checkGate(FEATURE_FLAGS.MevBlocker)
  const swapProtectionSetting = yield* select(selectWalletSwapProtectionSetting)
  const swapProtectionOn = swapProtectionSetting === SwapProtectionSetting.On
  const isMevBlockerSupportedOnChain = chainId
    ? isAlternativeRpcSupportedOnChain(chainId, AlternativeRpcType.MevBlocker)
    : false
  const shouldUseMevBlocker =
    swapProtectionOn && isMevBlockerSupportedOnChain && isMevBlockerFeatureEnabled

  return shouldUseMevBlocker ? AlternativeRpcType.MevBlocker : undefined
}

function* getPendingPrivateTransactionCount(address: Address) {
  const pendingTransactions = yield* select(makeSelectAddressTransactions(address))

  if (!pendingTransactions) return 0

  return pendingTransactions.filter(
    (tx) =>
      tx.status === TransactionStatus.Pending &&
      tx.typeInfo.type === TransactionType.Swap &&
      Boolean(tx.options.alternativeRpc)
  ).length
}
