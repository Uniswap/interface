import { getInternalError, getSdkError } from '@walletconnect/utils'
import { navigate } from 'src/app/navigation/rootNavigation'
import { wcWeb3Wallet } from 'src/features/walletConnect/walletConnectClient'
import { WalletSendCallsRequest, addRequest } from 'src/features/walletConnect/walletConnectSlice'
import { call, put, select } from 'typed-redux-saga'
import { UNISWAP_DELEGATION_ADDRESS } from 'uniswap/src/constants/addresses'
import { fetchWalletEncoding7702 } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { getCallsStatusHelper } from 'wallet/src/features/batchedTransactions/eip5792Utils'
import { transformCallsToTransactionRequests } from 'wallet/src/features/batchedTransactions/utils'
import { selectHasSmartWalletConsent } from 'wallet/src/features/wallet/selectors'

/**
 * Checks if EIP-5792 methods are enabled via feature flag
 * @returns Boolean indicating if EIP-5792 methods are enabled
 */
function isEip5792MethodsEnabled(): boolean {
  return getFeatureFlag(FeatureFlags.Eip5792Methods) ?? false
}

/**
 * Responds to a WalletConnect session request with an error
 * @param topic WalletConnect session topic
 * @param requestId ID of the request to respond to
 * @param error Error object containing message and code
 */
function* respondWithError(topic: string, requestId: number, error: { message: string; code: number }) {
  yield* call([wcWeb3Wallet, wcWeb3Wallet.respondSessionRequest], {
    topic,
    response: {
      id: requestId,
      jsonrpc: '2.0',
      error,
    },
  })
}

/**
 * Handles the WalletConnect request to get the status of a batch of calls
 * @param topic WalletConnect session topic
 * @param requestId ID of the request
 * @param batchId ID of the batch to check status for
 * @param accountAddress Address of the account making the request
 */
export function* handleGetCallsStatus(topic: string, requestId: number, batchId: string, accountAddress: string) {
  const eip5792MethodsEnabled = isEip5792MethodsEnabled()

  if (!eip5792MethodsEnabled) {
    yield* respondWithError(topic, requestId, getSdkError('WC_METHOD_UNSUPPORTED'))
    return
  }

  const { data, error } = yield* call(getCallsStatusHelper, batchId, accountAddress)

  if (error || !data) {
    yield* respondWithError(topic, requestId, getInternalError('MISSING_OR_INVALID', error))
    return
  }

  yield* call([wcWeb3Wallet, wcWeb3Wallet.respondSessionRequest], {
    topic,
    response: {
      id: requestId,
      jsonrpc: '2.0',
      result: data,
    },
  })
}

/**
 * Handles the WalletConnect request to send a batch of calls
 * @param topic WalletConnect session topic
 * @param requestId ID of the request
 * @param request The WalletSendCallsRequest object containing call data
 */
export function* handleSendCalls(topic: string, requestId: number, request: WalletSendCallsRequest) {
  const eip5792MethodsEnabled = isEip5792MethodsEnabled()

  if (!eip5792MethodsEnabled) {
    yield* respondWithError(topic, requestId, getSdkError('WC_METHOD_UNSUPPORTED'))
    return
  }

  try {
    const { requestId: encodedRequestId, encoded: encodedTransaction } = yield* call(fetchWalletEncoding7702, {
      calls: transformCallsToTransactionRequests(request.calls, request.chainId, request.account),
      smartContractDelegationAddress: UNISWAP_DELEGATION_ADDRESS,
      walletAddress: request.account,
    })

    const requestWithEncodedTransaction = {
      ...request,
      encodedRequestId,
      encodedTransaction,
    }

    yield* put(addRequest(requestWithEncodedTransaction))
  } catch (error) {
    logger.error(error, {
      tags: { file: 'batchTransactionSaga', function: 'handleSendCalls' },
    })
    yield* respondWithError(topic, requestId, getSdkError('USER_REJECTED'))
  }
}

/**
 * Handles the WalletConnect request to get capabilities for an account
 * @param topic WalletConnect session topic
 * @param requestId ID of the request
 * @param accountAddress Address of the connected account
 * @param requestedAccount Address of the account capabilities are being requested for
 */
export function* handleGetCapabilities(
  topic: string,
  requestId: number,
  accountAddress: string,
  requestedAccount: string,
  dappName?: string,
  dappIconUrl?: string,
) {
  const eip5792MethodsEnabled = isEip5792MethodsEnabled()

  if (!eip5792MethodsEnabled) {
    yield* respondWithError(topic, requestId, getSdkError('WC_METHOD_UNSUPPORTED'))
    return
  }

  if (requestedAccount.toLowerCase() !== accountAddress.toLowerCase()) {
    yield* respondWithError(topic, requestId, getSdkError('UNAUTHORIZED_METHOD'))
    return
  }

  const hasSmartWalletConsent = yield* select(selectHasSmartWalletConsent, accountAddress)

  // TODO(WALL-6765): check if wallet is already delegated
  if (!hasSmartWalletConsent) {
    const onEnableSmartWallet = () => {
      navigate(ModalName.SmartWalletEnabledModal, {
        showReconnectDappPrompt: true,
      })
    }

    yield* call(navigate, ModalName.PostSwapSmartWalletNudge, {
      onEnableSmartWallet,
      dappInfo: {
        icon: dappIconUrl,
        name: dappName,
      },
    })
  }

  yield* call([wcWeb3Wallet, wcWeb3Wallet.respondSessionRequest], {
    topic,
    response: {
      id: requestId,
      jsonrpc: '2.0',
      // TODO: This would be where we add any changes in capabilities object (when decided)
      result: {
        [`0x${UniverseChainId.Sepolia.toString(16)}`]: { atomic: { status: 'supported' } },
        [`0x${UniverseChainId.Mainnet.toString(16)}`]: { atomic: { status: 'supported' } },
        [`0x${UniverseChainId.UnichainSepolia.toString(16)}`]: { atomic: { status: 'supported' } },
        [`0x${UniverseChainId.Unichain.toString(16)}`]: { atomic: { status: 'supported' } },
        [`0x${UniverseChainId.Optimism.toString(16)}`]: { atomic: { status: 'supported' } },
        [`0x${UniverseChainId.Base.toString(16)}`]: { atomic: { status: 'supported' } },
      },
    },
  })
}
