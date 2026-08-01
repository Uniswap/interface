import { TradingApi } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { getInternalError, getSdkError } from '@walletconnect/utils'
import { navigate } from 'src/app/navigation/rootNavigation'
import { wcWeb3Wallet } from 'src/features/walletConnect/walletConnectClient'
import {
  addRequest,
  WalletSendCallsRequest,
  WalletSendCallsUserOperationRequest,
} from 'src/features/walletConnect/walletConnectSlice'
import { call, put, select } from 'typed-redux-saga'
import { checkWalletDelegation, TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getEnabledChainIdsSaga } from 'uniswap/src/features/settings/saga'
import { transformTradingApiUserOpToRpcUserOp } from 'uniswap/src/features/smartWallet/userOp/transformTradingApiUserOp'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { toTradingApiSupportedChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { logger } from 'utilities/src/logger/logger'
import { getCallsStatusHelper } from 'wallet/src/features/batchedTransactions/eip5792Utils'
import {
  getCapabilitiesForDelegationStatus,
  transformCallsToTransactionRequests,
} from 'wallet/src/features/batchedTransactions/utils'
import { selectHasShownEip5792Nudge } from 'wallet/src/features/behaviorHistory/selectors'
import { setHasShown5792Nudge } from 'wallet/src/features/behaviorHistory/slice'
import { getAccountDelegationDetails } from 'wallet/src/features/smartWallet/delegation/utils'
import { prepareDelegationAuthorization } from 'wallet/src/features/transactions/executeTransaction/eip7702Utils'
import { getProvider, getSignerManager } from 'wallet/src/features/wallet/context'
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
 * Signs the 7702 delegation authorization for a sponsored sendCalls userOp when
 * the wallet isn't yet delegated to Uniswap on `chainId`, so it can be bundled into the
 * encode_4337 request. The backend runs paymaster + bundler simulation server-side, so the
 * account must already appear delegated there. Returns undefined when no delegation is needed.
 */
export function* getSendCallsDelegationAuth({
  accountAddress,
  chainId,
}: {
  accountAddress: string
  chainId: UniverseChainId
}) {
  const delegationDetails = yield* call(getAccountDelegationDetails, accountAddress, chainId)
  if (!delegationDetails.needsDelegation || !delegationDetails.contractAddress) {
    return undefined
  }

  const signerManager = yield* call(getSignerManager)
  const signer = yield* call([signerManager, signerManager.getSignerForAccount], {
    address: accountAddress,
    type: AccountType.SignerMnemonic,
  })
  const provider = yield* call(getProvider, chainId)

  return yield* call(prepareDelegationAuthorization, {
    signer,
    provider,
    walletAddress: accountAddress,
    chainId,
    contractAddress: delegationDetails.contractAddress,
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
    const paymasterCapability = request.capabilities['paymasterService']
    const paymasterUrl = paymasterCapability?.['url']
    const shouldUse4337 =
      paymasterCapability && typeof paymasterUrl === 'string' && getFeatureFlag(FeatureFlags.Support7677GasSponsorship)

    if (shouldUse4337) {
      const rawPaymasterContext: unknown = paymasterCapability['context']
      if (
        rawPaymasterContext !== undefined &&
        (typeof rawPaymasterContext !== 'object' || rawPaymasterContext === null || Array.isArray(rawPaymasterContext))
      ) {
        yield* respondWithError({
          topic,
          requestId,
          error: getInternalError('MISSING_OR_INVALID', 'paymasterCapability.context must be a record or undefined'),
        })
        return
      }
      const paymasterServiceContext = rawPaymasterContext as Record<string, unknown> | undefined
      const chainId = toTradingApiSupportedChainId(request.chainId)
      if (!chainId) {
        yield* respondWithError({
          topic,
          requestId,
          error: getInternalError('MISSING_OR_INVALID', 'chainId is missing or unsupported'),
        })
        return
      }

      // Bundle the 7702 delegation auth into encode_4337 (signed up front) so the
      // backend's server-side paymaster + bundler simulation runs against a delegated account.
      const eip7702Auth = yield* call(getSendCallsDelegationAuth, {
        accountAddress: request.account,
        chainId: request.chainId,
      })

      const {
        requestId: encode4337RequestId,
        userOperation,
        gasSponsored,
        sponsorMetadata,
      } = yield* call(TradingApiClient.fetchWalletEncoding4337, {
        calls: transformCallsToTransactionRequests({
          calls: request.calls,
          chainId: request.chainId,
          accountAddress: request.account,
        }),
        sender: request.account,
        chainId,
        paymasterUrl,
        paymasterServiceContext,
        eip7702Auth,
      })

      const requestWithEncodedUserOp: WalletSendCallsUserOperationRequest = {
        ...request,
        unsignedUserOperation: transformTradingApiUserOpToRpcUserOp(userOperation),
        requestId: encode4337RequestId,
        gasSponsored,
        sponsorMetadata,
        paymasterServiceUrl: paymasterUrl,
        paymasterServiceContext,
      }
      yield* put(addRequest(requestWithEncodedUserOp))
    } else {
      // The delegation address comes from check_delegation for this wallet + chain.
      const delegationDetails = yield* call(getAccountDelegationDetails, request.account, request.chainId)
      const delegationAddress = delegationDetails.contractAddress
      if (!delegationAddress) {
        throw new Error(`No delegation address available for wallet on chain ${request.chainId}`)
      }

      const { requestId: encodedRequestId, encoded: encodedTransaction } = yield* call(
        TradingApiClient.fetchWalletEncoding7702,
        {
          calls: transformCallsToTransactionRequests({
            calls: request.calls,
            chainId: request.chainId,
            accountAddress: request.account,
          }),
          smartContractDelegationAddress: delegationAddress,
          walletAddress: request.account,
        },
      )

      const requestWithEncodedTransaction = {
        ...request,
        encodedRequestId,
        encodedTransaction,
      }
      yield* put(addRequest(requestWithEncodedTransaction))
    }
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
