/* eslint-disable max-lines */
import { Provider } from '@ethersproject/providers'
import { providerErrors, rpcErrors, serializeError } from '@metamask/rpc-errors'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { createSearchParams } from 'react-router'
import { changeChain } from 'src/app/features/dapp/changeChain'
import { DappInfo, dappStore } from 'src/app/features/dapp/store'
import { getActiveSignerConnectedAccount } from 'src/app/features/dapp/utils'
import {
  addRequest,
  confirmRequest,
  confirmRequestNoDappInfo,
  rejectRequest,
} from 'src/app/features/dappRequests/actions'
import type {
  DappRequestNoDappInfo,
  DappRequestRejectParams,
  DappRequestWithDappInfo,
  SenderTabInfo,
} from 'src/app/features/dappRequests/shared'
import { dappRequestActions, selectIsRequestConfirming } from 'src/app/features/dappRequests/slice'
import {
  BaseSendTransactionRequest,
  ChangeChainRequest,
  ErrorResponse,
  GetCallsStatusRequest,
  GetCallsStatusResponse,
  GetCapabilitiesRequest,
  ParsedCall,
  SendCallsRequest,
  SendCallsResponse,
  SendTransactionResponse,
  SignMessageRequest,
  SignMessageResponse,
  SignTypedDataRequest,
  SignTypedDataResponse,
  UniswapOpenSidebarRequest,
  UniswapOpenSidebarResponse,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { HexadecimalNumberSchema } from 'src/app/features/dappRequests/types/utilityTypes'
import { isWalletUnlocked } from 'src/app/hooks/useIsWalletUnlocked'
import { AppRoutes, HomeQueryParams } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { dappResponseMessageChannel } from 'src/background/messagePassing/messageChannels'
import getCalldataInfoFromTransaction from 'src/background/utils/getCalldataInfoFromTransaction'
import { call, put, select, take } from 'typed-redux-saga'
import { hexadecimalStringToInt, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { DappRequestType, DappResponseType } from 'uniswap/src/features/dappRequests/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getEnabledChainIdsSaga } from 'uniswap/src/features/settings/saga'
import {
  TransactionOriginType,
  TransactionType,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { extractBaseUrl } from 'utilities/src/format/urls'
import { logger } from 'utilities/src/logger/logger'
import { getCallsStatusHelper } from 'wallet/src/features/batchedTransactions/eip5792Utils'
import { addBatchedTransaction } from 'wallet/src/features/batchedTransactions/slice'
import { generateBatchId, getCapabilitiesResponse } from 'wallet/src/features/batchedTransactions/utils'
import { Call } from 'wallet/src/features/dappRequests/types'
import {
  ExecuteTransactionParams,
  executeTransaction,
} from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'
import { getProvider, getSignerManager } from 'wallet/src/features/wallet/context'
import { selectActiveAccount, selectHasSmartWalletConsent } from 'wallet/src/features/wallet/selectors'
import { signMessage, signTypedDataMessage } from 'wallet/src/features/wallet/signing/signing'

export function isDappRequestWithDappInfo(
  request: DappRequestNoDappInfo | DappRequestWithDappInfo,
): request is DappRequestWithDappInfo {
  return 'dappInfo' in request && Boolean(request.dappInfo)
}

export function* dappRequestWatcher() {
  while (true) {
    const { payload, type } = yield* take(addRequest)

    if (payload.dappRequest.type === DappRequestType.GetCapabilities) {
      const { senderTabInfo } = payload
      const dappUrl = extractBaseUrl(senderTabInfo.url)
      if (dappUrl) {
        yield* put(dappRequestActions.setMostRecent5792DappUrl(dappUrl))
      }
    }

    if (type === addRequest.type) {
      yield* call(handleRequest, payload)
    }
  }
}

const ACCOUNT_REQUEST_TYPES = [DappRequestType.RequestAccount, DappRequestType.RequestPermissions]
const ACCOUNT_INFO_TYPES = [DappRequestType.GetChainId, DappRequestType.GetAccount]

/**
 * Handles a request from a dApp.
 * If it is account-specific, get the active account and add it to the request
 * @param requestParams DappRequest and senderTabInfo (required for sending response)
 * i think remove all the checks from here and push to later.
 */
// eslint-disable-next-line complexity
function* handleRequest(requestParams: DappRequestNoDappInfo) {
  if (
    requestParams.dappRequest.type === DappRequestType.SendCalls ||
    requestParams.dappRequest.type === DappRequestType.GetCallsStatus ||
    requestParams.dappRequest.type === DappRequestType.GetCapabilities
  ) {
    const eip5792MethodsEnabled = getFeatureFlag(FeatureFlags.Eip5792Methods)
    if (!eip5792MethodsEnabled) {
      const response: DappRequestRejectParams = {
        errorResponse: {
          type: DappResponseType.ErrorResponse,
          error: serializeError(rpcErrors.methodNotSupported()),
          requestId: requestParams.dappRequest.requestId,
        },
        senderTabInfo: requestParams.senderTabInfo,
      }
      yield* put(rejectRequest(response))
      return
    }
  }

  if (requestParams.dappRequest.type === DappRequestType.UniswapOpenSidebar) {
    // We can auto-confirm these requests since they are only for navigating to a certain tab
    // At this point the sidebar is already open
    yield* call(handleConfirmRequestNoDappInfo, requestParams)
    return
  }
  const activeAccount = yield* select(selectActiveAccount)
  if (!activeAccount) {
    const response: DappRequestRejectParams = {
      errorResponse: {
        type: DappResponseType.ErrorResponse,
        error: serializeError(providerErrors.unauthorized()),
        requestId: requestParams.dappRequest.requestId,
      },
      senderTabInfo: requestParams.senderTabInfo,
    }
    yield* put(rejectRequest(response))
    return
  }

  const dappUrl = extractBaseUrl(requestParams.senderTabInfo.url)
  const dappInfo = yield* call(dappStore.getDappInfo, dappUrl)

  const isConnectedToDapp = dappInfo && dappInfo.connectedAccounts.length > 0

  if (!isConnectedToDapp) {
    if (requestParams.dappRequest.type === DappRequestType.GetChainId) {
      // Allows for eth_chainId for unconnected dapps to advance connection steps
      yield* put(confirmRequestNoDappInfo(requestParams))
    } else if (!ACCOUNT_REQUEST_TYPES.includes(requestParams.dappRequest.type)) {
      // Otherwise, only allows for accounts requests to be handled until connection is confirmed
      // TODO(EXT-359): show a warning when the active account is different.
      const response: DappRequestRejectParams = {
        errorResponse: {
          type: DappResponseType.ErrorResponse,
          error: serializeError(providerErrors.unauthorized()),
          requestId: requestParams.dappRequest.requestId,
        },
        senderTabInfo: requestParams.senderTabInfo,
      }
      yield* put(rejectRequest(response))
      return
    }
  }

  // Automatically confirm change chain requests if supported
  if (requestParams.dappRequest.type === DappRequestType.ChangeChain) {
    const chainId = toSupportedChainId(hexadecimalStringToInt(requestParams.dappRequest.chainId))
    if (chainId) {
      if (dappInfo) {
        yield* call(handleConfirmRequestWithDappInfo, { ...requestParams, dappInfo })
      } else {
        yield* call(handleConfirmRequestNoDappInfo, requestParams)
      }
      if (isWalletUnlocked) {
        yield* put(
          pushNotification({
            type: AppNotificationType.NetworkChanged,
            chainId,
          }),
        )
      }
    } else {
      const response: DappRequestRejectParams = {
        errorResponse: {
          type: DappResponseType.ErrorResponse,
          error: serializeError(
            providerErrors.custom({
              code: 4902,
              message: 'Uniswap Wallet does not support switching to this chain.',
            }),
          ),
          requestId: requestParams.dappRequest.requestId,
        },
        senderTabInfo: requestParams.senderTabInfo,
      }
      if (isWalletUnlocked) {
        yield* put(
          pushNotification({
            type: AppNotificationType.NotSupportedNetwork,
          }),
        )
      }
      yield* put(rejectRequest(response))
      return
    }
  }

  if (requestParams.dappRequest.type === DappRequestType.SignTypedData) {
    try {
      const typedData = requestParams.dappRequest.typedData
      const parsedChainId = JSON.parse(typedData)?.domain?.chainId
      const formattedChainId = HexadecimalNumberSchema.parse(parsedChainId)
      const chainId = toSupportedChainId(formattedChainId)

      if (dappInfo?.lastChainId !== chainId) {
        throw new Error('Chain ID on message does not match the chain ID set on the extension.')
      }
    } catch (error) {
      logger.error(error, { tags: { file: 'saga.ts', function: 'handleRequest' } })
      const response: DappRequestRejectParams = {
        errorResponse: {
          type: DappResponseType.ErrorResponse,
          error: serializeError(
            providerErrors.custom({
              code: 4902,
              message:
                error instanceof Error
                  ? error.message
                  : 'Chain ID on message from dApp is missing or does not match the chain ID set on the extension.',
            }),
          ),
          requestId: requestParams.dappRequest.requestId,
        },
        senderTabInfo: requestParams.senderTabInfo,
      }
      yield* put(rejectRequest(response))
    }
  }

  if (requestParams.dappRequest.type === DappRequestType.SendCalls) {
    try {
      const parsedChainId = requestParams.dappRequest.chainId
      const formattedChainId = HexadecimalNumberSchema.parse(parsedChainId)
      const chainId = toSupportedChainId(formattedChainId)

      if (dappInfo?.lastChainId !== chainId) {
        throw new Error('Chain ID on message does not match the chain ID set on the extension.')
      }

      const parsedCalls = requestParams.dappRequest.calls.map((call): Call | ParsedCall => ({
        ...call,
        ...(call.data ? getCalldataInfoFromTransaction({ data: call.data, to: call.to, chainId }) : {}),
      }))

      const parsedRequestParams = {
        ...requestParams,
        dappRequest: { ...requestParams.dappRequest, calls: parsedCalls },
      }

      yield* put(
        dappRequestActions.add({
          ...parsedRequestParams,
          dappInfo,
        }),
      )
      return
    } catch (error) {
      logger.error(error, { tags: { file: 'saga.ts', function: 'handleRequest' } })
      const response: DappRequestRejectParams = {
        errorResponse: {
          type: DappResponseType.ErrorResponse,
          error: serializeError(
            providerErrors.custom({
              code: 4902,
              message:
                error instanceof Error
                  ? error.message
                  : 'Chain ID on message from dApp is missing or does not match the chain ID set on the extension.',
            }),
          ),
          requestId: requestParams.dappRequest.requestId,
        },
        senderTabInfo: requestParams.senderTabInfo,
      }
      yield* put(rejectRequest(response))
    }
  }

  const shouldAutoConfirmRequest =
    dappInfo &&
    isConnectedToDapp &&
    (ACCOUNT_REQUEST_TYPES.includes(requestParams.dappRequest.type) ||
      ACCOUNT_INFO_TYPES.includes(requestParams.dappRequest.type) ||
      requestParams.dappRequest.type === DappRequestType.RevokePermissions ||
      requestParams.dappRequest.type === DappRequestType.GetCallsStatus ||
      requestParams.dappRequest.type === DappRequestType.GetCapabilities)

  if (shouldAutoConfirmRequest) {
    yield* call(handleConfirmRequestWithDappInfo, { ...requestParams, dappInfo })
  } else {
    yield* put(
      dappRequestActions.add({
        ...requestParams,
        dappInfo,
      }),
    )
  }
}

export function* handleSendTransaction({
  request,
  senderTabInfo: { id },
  dappInfo,
  transactionTypeInfo,
  preSignedTransaction,
}: {
  request: BaseSendTransactionRequest
  senderTabInfo: SenderTabInfo
  dappInfo: DappInfo
  transactionTypeInfo?: TransactionTypeInfo
  preSignedTransaction?: SignedTransactionRequest
}) {
  const transactionRequest = request.transaction
  const { lastChainId, activeConnectedAddress, connectedAccounts } = dappInfo
  const account = getActiveSignerConnectedAccount(connectedAccounts, activeConnectedAddress)
  const chainId = toSupportedChainId(request.transaction.chainId)
  if (request.transaction.chainId && chainId) {
    if (lastChainId !== chainId) {
      throw new Error(`Mismatched chainId - expected active chain: ${lastChainId}, received: ${chainId}`)
    }
  }

  const provider = yield* call(getProvider, lastChainId)

  const sendTransactionParams: ExecuteTransactionParams = {
    chainId: lastChainId,
    account,
    options: { request: transactionRequest },
    typeInfo: transactionTypeInfo ?? {
      type: TransactionType.Unknown,
      dappInfo: {
        name: dappInfo.displayName,
        address: request.transaction.to,
        icon: dappInfo.iconUrl,
      },
    },
    transactionOriginType: TransactionOriginType.External,
    preSignedTransaction,
  }

  const { transactionHash } = yield* call(executeTransaction, sendTransactionParams)

  // Trigger a pending transaction notification after we send the transaction to chain
  yield* put(
    pushNotification({
      type: AppNotificationType.TransactionPending,
      chainId: lastChainId,
    }),
  )

  // do not block on this function call since it should happen in parallel
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  onTransactionSentToChain(transactionHash, provider)

  const response: SendTransactionResponse = {
    type: DappResponseType.SendTransactionResponse,
    transactionHash,
    requestId: request.requestId,
  }
  yield* call(dappResponseMessageChannel.sendMessageToTab, id, response)
}

// TODO(EXT-976): Fix chrome notifications to work when the sidepanel is asleep.
async function onTransactionSentToChain(transactionHash: string, provider: Provider): Promise<void> {
  // Listen for transaction receipt
  const receipt = await provider.waitForTransaction(transactionHash, 1)

  if (receipt.status === 100) {
    // Send chrome notification that transaction was successful
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '',
      title: 'Transaction successful',
      message: `Transaction ${transactionHash} was successful`,
    })
  }
}

export function* changeChainSaga(request: ChangeChainRequest, { id, url }: SenderTabInfo) {
  const updatedChainId = toSupportedChainId(hexadecimalStringToInt(request.chainId))
  const provider = updatedChainId ? yield* call(getProvider, updatedChainId) : undefined
  const dappUrl = extractBaseUrl(url)
  const activeAccount = yield* select(selectActiveAccount)
  const response = changeChain({
    provider,
    dappUrl,
    updatedChainId,
    requestId: request.requestId,
    activeConnectedAddress: activeAccount?.address,
  })
  yield* call(dappResponseMessageChannel.sendMessageToTab, id, response)
}

export function* handleSignMessage({
  request,
  senderTabInfo: { id },
  dappInfo,
}: {
  request: SignMessageRequest
  senderTabInfo: SenderTabInfo
  dappInfo: DappInfo
}) {
  const { requestId, messageHex } = request
  const { connectedAccounts, activeConnectedAddress } = dappInfo
  const currentAccount = getActiveSignerConnectedAccount(connectedAccounts, activeConnectedAddress)

  const signerManager = yield* call(getSignerManager)
  const provider = yield* call(getProvider, dappInfo.lastChainId)

  const signature = yield* call(signMessage, { message: messageHex, account: currentAccount, signerManager, provider })

  const response: SignMessageResponse = {
    type: DappResponseType.SignMessageResponse,
    requestId,
    signature,
  }

  yield* call(dappResponseMessageChannel.sendMessageToTab, id, response)
}

export function* handleSignTypedData({
  dappRequest,
  senderTabInfo,
  dappInfo,
}: {
  dappRequest: SignTypedDataRequest
  senderTabInfo: SenderTabInfo
  dappInfo: DappInfo
}) {
  try {
    const requestId = dappRequest.requestId
    const typedData = dappRequest.typedData

    // This should already be handled when request is received, but extra check here
    const parsedChainId = JSON.parse(typedData)?.domain?.chainId
    const formattedChainId = HexadecimalNumberSchema.parse(parsedChainId)
    const chainId = toSupportedChainId(formattedChainId)
    if (!chainId) {
      throw new Error(!parsedChainId ? 'Missing domain chainId' : 'Unsupported chainId')
    }

    const { lastChainId, connectedAccounts, activeConnectedAddress } = dappInfo

    if (lastChainId !== chainId) {
      throw new Error(`Mismatched chainId - expected active chain: ${lastChainId}, received: ${chainId}`)
    }

    const currentAccount = getActiveSignerConnectedAccount(connectedAccounts, activeConnectedAddress)
    const signerManager = yield* call(getSignerManager)
    const provider = yield* call(getProvider, lastChainId)

    const signature = yield* call(signTypedDataMessage, {
      message: typedData,
      account: currentAccount,
      signerManager,
      provider,
    })

    const response: SignTypedDataResponse = {
      type: DappResponseType.SignTypedDataResponse,
      requestId,
      signature,
    }

    yield* call(dappResponseMessageChannel.sendMessageToTab, senderTabInfo.id, response)
  } catch (error) {
    if (error instanceof Error) {
      const errorParams: DappRequestRejectParams = {
        errorResponse: {
          type: DappResponseType.ErrorResponse,
          error: serializeError(rpcErrors.invalidParams(error.message)),
          requestId: dappRequest.requestId,
        },
        senderTabInfo,
      }
      yield* put(rejectRequest(errorParams))
    }
    logger.error(error, {
      tags: {
        file: 'saga.ts',
        function: 'handleSignTypedData',
      },
      extra: {
        dappUrl: senderTabInfo.url,
      },
    })
  }
}

export function* handleUniswapOpenSidebarRequest(request: UniswapOpenSidebarRequest, senderTabInfo: SenderTabInfo) {
  if (request.tab) {
    yield* call(navigate, {
      pathname: AppRoutes.Home,
      search: createSearchParams({
        [HomeQueryParams.Tab]: request.tab,
      }).toString(),
    })
  }
  const response: UniswapOpenSidebarResponse = {
    type: DappResponseType.UniswapOpenSidebarResponse,
    requestId: request.requestId,
  }
  yield* call(dappResponseMessageChannel.sendMessageToTab, senderTabInfo.id, response)
}

/**
 * Handle wallet_getCapabilities request
 * This method returns the capabilities supported by the wallet for specific chains
 */
export function* handleGetCapabilities(request: GetCapabilitiesRequest, senderTabInfo: SenderTabInfo) {
  const { chains: enabledChains } = yield* call(getEnabledChainIdsSaga, Platform.EVM)
  const hasSmartWalletConsent = yield* select(selectHasSmartWalletConsent, request.address)
  const chainIds = request.chainIds?.map(hexadecimalStringToInt) ?? enabledChains.map((chain) => chain.valueOf())

  const response = yield* call(getCapabilitiesResponse, {
    request,
    chainIds,
    hasSmartWalletConsent,
  })

  yield* call(dappResponseMessageChannel.sendMessageToTab, senderTabInfo.id, response)
}

/**
 * Handle wallet_sendCalls request
 * This method allows dapps to send a batch of calls to the wallet
 */
export function* handleSendCalls({
  request,
  senderTabInfo: { id },
  dappInfo,
  transactionTypeInfo,
  preSignedTransaction,
}: {
  request: SendCallsRequest
  senderTabInfo: SenderTabInfo
  dappInfo: DappInfo
  transactionTypeInfo?: TransactionTypeInfo
  preSignedTransaction?: SignedTransactionRequest
}) {
  const isSendCallTransaction = transactionTypeInfo?.type === TransactionType.SendCalls
  if (!isSendCallTransaction || !transactionTypeInfo.encodedTransaction || !transactionTypeInfo.encodedRequestId) {
    const errorResponse: ErrorResponse = {
      type: DappResponseType.ErrorResponse,
      error: serializeError(rpcErrors.invalidInput()),
      requestId: request.requestId,
    }
    yield* call(dappResponseMessageChannel.sendMessageToTab, id, errorResponse)
    return
  }

  try {
    const chainId = toSupportedChainId(hexadecimalStringToInt(request.chainId))
    if (!chainId) {
      const errorResponse: ErrorResponse = {
        type: DappResponseType.ErrorResponse,
        error: serializeError(rpcErrors.invalidParams('Invalid chainId')),
        requestId: request.requestId,
      }
      yield* call(dappResponseMessageChannel.sendMessageToTab, id, errorResponse)
      return
    }

    const activeAccount = getActiveSignerConnectedAccount(dappInfo.connectedAccounts, dappInfo.activeConnectedAddress)

    // Generate or use provided batch ID
    const batchId = request.id || generateBatchId()

    const { encodedTransaction, encodedRequestId } = transactionTypeInfo
    const sendTransactionParams: ExecuteTransactionParams = {
      chainId,
      account: activeAccount,
      typeInfo: {
        type: TransactionType.SendCalls,
        encodedTransaction,
        encodedRequestId,
        dappInfo: {
          name: dappInfo.displayName,
          address: encodedTransaction.to,
          icon: dappInfo.iconUrl,
        },
      },
      options: {
        request: encodedTransaction,
      },
      transactionOriginType: TransactionOriginType.External,
      preSignedTransaction,
    }

    const { transactionHash } = yield* call(executeTransaction, sendTransactionParams)

    yield* put(
      addBatchedTransaction({
        batchId,
        txHashes: [transactionHash], // Assuming single tx for now, might need update if batching changes
        requestId: encodedRequestId,
        chainId,
      }),
    )

    const response: SendCallsResponse = {
      type: DappResponseType.SendCallsResponse,
      requestId: request.requestId,
      response: {
        id: batchId,
        capabilities: request.capabilities || {},
      },
    }

    yield* call(dappResponseMessageChannel.sendMessageToTab, id, response)
  } catch (error) {
    logger.error(error, {
      tags: { file: 'dappRequestSaga', function: 'handleSendCalls' },
      extra: { request },
    })

    const errorResponse: ErrorResponse = {
      type: DappResponseType.ErrorResponse,
      error: serializeError(rpcErrors.internal(error instanceof Error ? error.message : 'Failed to send calls')),
      requestId: request.requestId,
    }
    yield* call(dappResponseMessageChannel.sendMessageToTab, id, errorResponse)
  }
}

/**
 * Handle wallet_getCallsStatus request
 * This method returns the status of a call batch that was sent via wallet_sendCalls
 */
export function* handleGetCallsStatus({
  request,
  senderTabInfo: { id },
}: {
  request: GetCallsStatusRequest
  senderTabInfo: SenderTabInfo
  dappInfo: DappInfo
}) {
  const activeAccount = yield* select(selectActiveAccount)
  if (!activeAccount) {
    const errorResponse: ErrorResponse = {
      type: DappResponseType.ErrorResponse,
      error: serializeError(rpcErrors.internal('No active account found')),
      requestId: request.requestId,
    }
    yield* call(dappResponseMessageChannel.sendMessageToTab, id, errorResponse)
    return
  }

  const { data, error } = yield* call(getCallsStatusHelper, request.batchId, activeAccount.address)

  if (error || !data) {
    const errorResponse: ErrorResponse = {
      type: DappResponseType.ErrorResponse,
      error: serializeError(rpcErrors.invalidParams(error)),
      requestId: request.requestId,
    }
    yield* call(dappResponseMessageChannel.sendMessageToTab, id, errorResponse)
    return
  }

  const response: GetCallsStatusResponse = {
    type: DappResponseType.GetCallsStatusResponse,
    requestId: request.requestId,
    response: data,
  }

  yield* call(dappResponseMessageChannel.sendMessageToTab, id, response)
}

function* isRequestConfirming(requestId: string) {
  const isConfirming = yield* select(selectIsRequestConfirming, requestId)
  return isConfirming
}

function* handleConfirmRequestWithDappInfo(request: DappRequestWithDappInfo) {
  if (yield* isRequestConfirming(request.dappRequest.requestId)) {
    return
  }
  yield* put(confirmRequest(request))
}

function* handleConfirmRequestNoDappInfo(request: DappRequestNoDappInfo) {
  if (yield* isRequestConfirming(request.dappRequest.requestId)) {
    return
  }
  yield* put(confirmRequestNoDappInfo(request))
}
