import { TradingApi } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { getInternalError, getSdkError } from '@walletconnect/utils'
import { navigate } from 'src/app/navigation/rootNavigation'
import { wcWeb3Wallet } from 'src/features/walletConnect/walletConnectClient'
import { addRequest, WalletSendCallsRequest } from 'src/features/walletConnect/walletConnectSlice'
import { call, put, select } from 'typed-redux-saga'
import { UNISWAP_DELEGATION_ADDRESS } from 'uniswap/src/constants/addresses'
import { checkWalletDelegation, TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getEnabledChainIdsSaga } from 'uniswap/src/features/settings/saga'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { getCallsStatusHelper } from 'wallet/src/features/batchedTransactions/eip5792Utils'
import {
  getCapabilitiesForDelegationStatus,
  transformCallsToTransactionRequests,
} from 'wallet/src/features/batchedTransactions/utils'
import { selectHasShownEip5792Nudge } from 'wallet/src/features/behaviorHistory/selectors'
import { setHasShown5792Nudge } from 'wallet/src/features/behaviorHistory/slice'
import { selectHasSmartWalletConsent } from 'wallet/src/features/wallet/selectors'

/**
 * Checks if EIP-5792 methods are enabled via feature flag
 * @returns Boolean indicating if EIP-5792 methods are enabled
 */
function isEip5792MethodsEnabled(): boolean {
  return getFeatureFlag(FeatureFlags.Eip5792Methods)
}

/**
 * Responds to a WalletConnect session request with an error
 * @param topic WalletConnect session topic
 * @param requestId ID of the request to respond to
 * @param error Error object containing message and code
 */
function* respondWithError({
  topic,
  requestId,
  error,
}: {
  topic: string
  requestId: number
  error: { message: string; code: number }
}) {
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
export function* handleGetCallsStatus({
  topic,
  requestId,
  batchId,
  accountAddress,
}: {
  topic: string
  requestId: number
  batchId: string
  accountAddress: string
}) {
  const eip5792MethodsEnabled = isEip5792MethodsEnabled()

  if (!eip5792MethodsEnabled) {
    yield* respondWithError({ topic, requestId, error: getSdkError('WC_METHOD_UNSUPPORTED') })
    return
  }

  const { data, error } = yield* call(getCallsStatusHelper, batchId, accountAddress)

  if (error || !data) {
    yield* respondWithError({ topic, requestId, error: getInternalError('MISSING_OR_INVALID', error) })
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
export function* handleSendCalls({
  topic,
  requestId,
  request,
}: {
  topic: string
  requestId: number
  request: WalletSendCallsRequest
}) {
  const eip5792MethodsEnabled = isEip5792MethodsEnabled()

  if (!eip5792MethodsEnabled) {
    yield* respondWithError({ topic, requestId, error: getSdkError('WC_METHOD_UNSUPPORTED') })
    return
  }

  try {
    const { requestId: encodedRequestId, encoded: encodedTransaction } = yield* call(
      TradingApiClient.fetchWalletEncoding7702,
      {
        calls: transformCallsToTransactionRequests({
          calls: request.calls,
          chainId: request.chainId,
          accountAddress: request.account,
        }),
        smartContractDelegationAddress: UNISWAP_DELEGATION_ADDRESS,
        walletAddress: request.account,
      },
    )

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
    yield* respondWithError({ topic, requestId, error: getSdkError('USER_REJECTED') })
  }
}

/**
 * Handles the WalletConnect request to get capabilities for an account
 * @param topic WalletConnect session topic
 * @param requestId ID of the request
 * @param accountAddress Address of the connected account
 * @param requestedAccount Address of the account capabilities are being requested for
 * @param chainIdsFromRequest Chain IDs from the request
 * @param dappName Name of the dapp
 * @param dappIconUrl Icon URL of the dapp
 */
export function* handleGetCapabilities({
  topic,
  requestId,
  accountAddress,
  requestedAccount,
  chainIdsFromRequest,
  dappUrl,
  dappName,
  dappIconUrl,
}: {
  topic: string
  requestId: number
  accountAddress: string
  requestedAccount: string
  chainIdsFromRequest?: UniverseChainId[]
  dappUrl: string
  dappName?: string
  dappIconUrl?: string
}) {
  const eip5792MethodsEnabled = isEip5792MethodsEnabled()

  if (!eip5792MethodsEnabled) {
    yield* respondWithError({ topic, requestId, error: getSdkError('WC_METHOD_UNSUPPORTED') })
    return
  }

  if (requestedAccount.toLowerCase() !== accountAddress.toLowerCase()) {
    yield* respondWithError({ topic, requestId, error: getSdkError('UNAUTHORIZED_METHOD') })
    return
  }

  const hasSmartWalletConsent = yield* select(selectHasSmartWalletConsent, accountAddress)
  const hasShownNudge = yield* select(selectHasShownEip5792Nudge, accountAddress, dappUrl)

  const { chains: enabledChains } = yield* call(getEnabledChainIdsSaga, Platform.EVM)

  const chainIds = (chainIdsFromRequest ?? enabledChains).map((chainId) => chainId.valueOf())

  let delegationStatusResponse: TradingApi.WalletCheckDelegationResponseBody | undefined

  let hasNoExistingDelegations = true

  try {
    delegationStatusResponse = yield* call(checkWalletDelegation, {
      walletAddresses: [accountAddress],
      chainIds: chainIds.map((chain) => chain.valueOf()),
    })

    const detailsMap = delegationStatusResponse.delegationDetails[accountAddress]

    if (detailsMap) {
      const hasAtLeastOneDelegation = Object.values(detailsMap).some(
        (details) => !!details.currentDelegationAddress && !details.isWalletDelegatedToUniswap,
      )

      hasNoExistingDelegations = !hasAtLeastOneDelegation
    }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'dappRequestSaga', function: 'handleGetCapabilities' },
      extra: { accountAddress },
    })
  }

  if (!hasSmartWalletConsent && !hasShownNudge && hasNoExistingDelegations) {
    // Update the state to mark that we've shown the nudge
    yield* put(
      setHasShown5792Nudge({
        walletAddress: accountAddress,
        dappUrl,
      }),
    )

    yield* call(navigate, ModalName.SmartWalletNudge, {
      dappInfo: {
        icon: dappIconUrl,
        name: dappName,
      },
    })
  }

  const capabilities = yield* call(
    getCapabilitiesForDelegationStatus,
    delegationStatusResponse?.delegationDetails[accountAddress],
    hasSmartWalletConsent,
  )

  yield* call([wcWeb3Wallet, wcWeb3Wallet.respondSessionRequest], {
    topic,
    response: {
      id: requestId,
      jsonrpc: '2.0',
      result: capabilities,
    },
  })
}
