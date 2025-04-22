import { Provider, TransactionResponse } from '@ethersproject/providers'
import { providerErrors, rpcErrors, serializeError } from '@metamask/rpc-errors'
import { createAction } from '@reduxjs/toolkit'
import { createSearchParams } from 'react-router-dom'
import { changeChain } from 'src/app/features/dapp/changeChain'
import { DappInfo, dappStore } from 'src/app/features/dapp/store'
import { getActiveConnectedAccount } from 'src/app/features/dapp/utils'
import { DappRequestStoreItem, SenderTabInfo, dappRequestActions } from 'src/app/features/dappRequests/slice'
import {
  BaseSendTransactionRequest,
  ChangeChainRequest,
  DappRequestType,
  DappResponseType,
  ErrorResponse,
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
import { call, put, select, take } from 'typed-redux-saga'
import { hexadecimalStringToInt, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import {
  TransactionOriginType,
  TransactionType,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { extractBaseUrl } from 'utilities/src/format/urls'
import { logger } from 'utilities/src/logger/logger'
import { SendTransactionParams, sendTransaction } from 'wallet/src/features/transactions/sendTransactionSaga'
import { getProvider, getSignerManager } from 'wallet/src/features/wallet/context'
import { selectActiveAccount } from 'wallet/src/features/wallet/selectors'
import { signMessage, signTypedDataMessage } from 'wallet/src/features/wallet/signing/signing'

export interface DappRequestRejectParams {
  errorResponse: ErrorResponse
  senderTabInfo: SenderTabInfo
}

type OptionalTransactionTypeInfo = {
  transactionTypeInfo?: TransactionTypeInfo
}
export type DappRequestNoDappInfo = Omit<DappRequestStoreItem, 'dappInfo'> & OptionalTransactionTypeInfo
export type DappRequestWithDappInfo = Required<DappRequestStoreItem> & OptionalTransactionTypeInfo
export function isDappRequestWithDappInfo(
  request: DappRequestNoDappInfo | DappRequestWithDappInfo,
): request is DappRequestWithDappInfo {
  return 'dappInfo' in request && Boolean(request.dappInfo)
}

export const addRequest = createAction<DappRequestNoDappInfo>(`dappRequest/handleRequest`)

/** This is for requests where the dapp info is not passed along as part of the request because it
 * does not exist yet (i.e. GetAccountRequest). In these cases the dappInfo will need to be saved.
 */
export const confirmRequestNoDappInfo = createAction<DappRequestNoDappInfo>('dappRequest/confirmSaveConnectionRequest')
export const confirmRequest = createAction<DappRequestWithDappInfo>(`dappRequest/confirmRequest`)
export const rejectRequest = createAction<DappRequestRejectParams>(`dappRequest/rejectRequest`)
export const rejectAllRequests = createAction('dappRequest/rejectAllRequests')

export function* dappRequestWatcher() {
  while (true) {
    const { payload, type } = yield* take(addRequest)

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
  if (requestParams.dappRequest.type === DappRequestType.UniswapOpenSidebar) {
    // We can auto-confirm these requests since they are only for navigating to a certain tab
    // At this point the sidebar is already open
    yield* put(confirmRequestNoDappInfo(requestParams))
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
    rejectRequest(response)
    return
  }

  const dappUrl = extractBaseUrl(requestParams.senderTabInfo.url)
  const dappInfo = yield* call(dappStore.getDappInfo, dappUrl)

  const isConnectedToDapp = dappInfo && dappInfo.connectedAccounts?.length > 0

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
        yield* put(confirmRequest({ ...requestParams, dappInfo }))
      } else {
        yield* put(confirmRequestNoDappInfo(requestParams))
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

  const shouldAutoConfirmRequest =
    dappInfo &&
    isConnectedToDapp &&
    (ACCOUNT_REQUEST_TYPES.includes(requestParams.dappRequest.type) ||
      ACCOUNT_INFO_TYPES.includes(requestParams.dappRequest.type) ||
      requestParams.dappRequest.type === DappRequestType.RevokePermissions)

  if (shouldAutoConfirmRequest) {
    yield* put(confirmRequest({ ...requestParams, dappInfo }))
  } else {
    yield* put(
      dappRequestActions.add({
        ...requestParams,
        dappInfo,
      }),
    )
  }
}

export function* handleSendTransaction(
  request: BaseSendTransactionRequest,
  { id }: SenderTabInfo,
  dappInfo: DappInfo,
  transactionTypeInfo?: TransactionTypeInfo,
) {
  const transactionRequest = request.transaction
  const { lastChainId, activeConnectedAddress, connectedAccounts } = dappInfo
  const account = getActiveConnectedAccount(connectedAccounts, activeConnectedAddress)
  const chainId = toSupportedChainId(request.transaction.chainId)
  if (request.transaction.chainId && chainId) {
    if (lastChainId !== chainId) {
      throw new Error(`Mismatched chainId - expected active chain: ${lastChainId}, received: ${chainId}`)
    }
  }

  const provider = yield* call(getProvider, lastChainId)

  const sendTransactionParams: SendTransactionParams = {
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
  }

  const { transactionResponse } = yield* call(sendTransaction, sendTransactionParams)

  // Trigger a pending transaction notification after we send the transaction to chain
  yield* put(
    pushNotification({
      type: AppNotificationType.TransactionPending,
      chainId: lastChainId,
    }),
  )

  // do not block on this function call since it should happen in parallel
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  onTransactionSentToChain(transactionResponse, provider)

  const response: SendTransactionResponse = {
    type: DappResponseType.SendTransactionResponse,
    transactionResponse,
    requestId: request.requestId,
  }
  yield* call(dappResponseMessageChannel.sendMessageToTab, id, response)
}

// TODO(EXT-976): Fix chrome notifications to work when the sidepanel is asleep.
async function onTransactionSentToChain(transactionResponse: TransactionResponse, provider: Provider): Promise<void> {
  // Listen for transaction receipt
  const receipt = await provider.waitForTransaction(transactionResponse.hash, 1)

  if (receipt.status === 100) {
    // Send chrome notification that transaction was successful
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '',
      title: 'Transaction successful',
      message: `Transaction ${transactionResponse.hash} was successful`,
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

export function* handleSignMessage(request: SignMessageRequest, { id }: SenderTabInfo, dappInfo: DappInfo) {
  const { requestId, messageHex } = request
  const { connectedAccounts, activeConnectedAddress } = dappInfo
  const currentAccount = getActiveConnectedAccount(connectedAccounts, activeConnectedAddress)

  const signerManager = yield* call(getSignerManager)
  const provider = yield* call(getProvider, dappInfo.lastChainId)

  const signature = yield* call(signMessage, messageHex, currentAccount, signerManager, provider)

  const response: SignMessageResponse = {
    type: DappResponseType.SignMessageResponse,
    requestId,
    signature,
  }

  yield* call(dappResponseMessageChannel.sendMessageToTab, id, response)
}

export function* handleSignTypedData(
  dappRequest: SignTypedDataRequest,
  senderTabInfo: SenderTabInfo,
  dappInfo: DappInfo,
) {
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

    const currentAccount = getActiveConnectedAccount(connectedAccounts, activeConnectedAddress)
    const signerManager = yield* call(getSignerManager)
    const provider = yield* call(getProvider, lastChainId)

    const signature = yield* call(signTypedDataMessage, typedData, currentAccount, signerManager, provider)

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
