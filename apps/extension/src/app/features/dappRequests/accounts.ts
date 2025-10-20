/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { JsonRpcProvider } from '@ethersproject/providers'
import { providerErrors, serializeError } from '@metamask/rpc-errors'
import { saveDappConnection } from 'src/app/features/dapp/actions'
import { DappInfo, dappStore } from 'src/app/features/dapp/store'
import { getOrderedConnectedAddresses } from 'src/app/features/dapp/utils'
import type { SenderTabInfo } from 'src/app/features/dappRequests/shared'
import {
  AccountResponse,
  DappRequest,
  ErrorResponse,
  GetAccountRequest,
  RequestAccountRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { dappResponseMessageChannel } from 'src/background/messagePassing/messageChannels'
import { call, put, select } from 'typed-redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { chainIdToHexadecimalString } from 'uniswap/src/features/chains/utils'
import { DappResponseType } from 'uniswap/src/features/dappRequests/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getEnabledChainIdsSaga } from 'uniswap/src/features/settings/saga'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { extractBaseUrl } from 'utilities/src/format/urls'
import { getProvider } from 'wallet/src/features/wallet/context'
import { selectActiveAccount } from 'wallet/src/features/wallet/selectors'

function getAccountResponse({
  chainId,
  dappRequest,
  provider,
  dappInfo,
}: {
  chainId: UniverseChainId
  dappRequest: DappRequest
  provider: JsonRpcProvider
  dappInfo: DappInfo
}): AccountResponse {
  const orderedConnectedAddresses = getOrderedConnectedAddresses(
    dappInfo.connectedAccounts,
    dappInfo.activeConnectedAddress,
  )

  return {
    type: DappResponseType.AccountResponse,
    requestId: dappRequest.requestId,
    connectedAddresses: orderedConnectedAddresses,
    chainId: chainIdToHexadecimalString(chainId),
    providerUrl: provider.connection.url,
  }
}

function sendAccountResponseAnalyticsEvent({
  senderUrl,
  chainId,
  dappInfo,
  accountResponse,
}: {
  senderUrl: string
  chainId: UniverseChainId
  dappInfo: DappInfo
  accountResponse: AccountResponse
}): void {
  const dappUrl = extractBaseUrl(senderUrl)

  sendAnalyticsEvent(ExtensionEventName.DappConnect, {
    dappUrl: dappUrl ?? '',
    chainId,
    activeConnectedAddress: dappInfo.activeConnectedAddress,
    connectedAddresses: accountResponse.connectedAddresses,
  })
}

/**
 * Gets the active account, and returns the account address, chainId, and providerUrl.
 * Chain id + provider url are from the last connected chain for the dApp and wallet. If this has not been set, it will be the default chain and provider.
 */
export function* getAccount({
  dappRequest,
  senderTabInfo: { id, url },
  dappInfo,
}: {
  dappRequest: GetAccountRequest | RequestAccountRequest
  senderTabInfo: SenderTabInfo
  dappInfo: DappInfo
}) {
  const chainId = dappInfo.lastChainId
  const provider = yield* call(getProvider, chainId)

  const response = getAccountResponse({ chainId, dappRequest, provider, dappInfo })
  sendAccountResponseAnalyticsEvent({ senderUrl: url, chainId, dappInfo, accountResponse: response })

  yield* call(dappResponseMessageChannel.sendMessageToTab, id, response)
}

/**
 * Saves the active account as connected to the dapp and parses out necessary data
 * Triggers a notification for new connections
 */
export function* saveAccount({ url, favIconUrl }: SenderTabInfo) {
  const activeAccount = yield* select(selectActiveAccount)
  const dappUrl = extractBaseUrl(url)
  const dappInfo = yield* call(dappStore.getDappInfo, dappUrl)
  const { defaultChainId } = yield* call(getEnabledChainIdsSaga, Platform.EVM)

  if (!dappUrl || !activeAccount) {
    return undefined
  }

  yield* call(saveDappConnection, { dappUrl, account: activeAccount, iconUrl: favIconUrl })
  // No dapp info means that this is a first time connection request
  if (!dappInfo) {
    yield* put(
      pushNotification({
        type: AppNotificationType.DappConnected,
        dappIconUrl: favIconUrl,
      }),
    )
  }

  const chainId = dappInfo?.lastChainId ?? defaultChainId
  const provider = yield* call(getProvider, chainId)
  const connectedAddresses = (dappUrl && (yield* call(dappStore.getDappOrderedConnectedAddresses, dappUrl))) || []

  return {
    dappUrl,
    activeAccount,
    connectedAddresses,
    chainId,
    providerUrl: provider.connection.url,
  }
}

/**
 * Gets the active account, and returns the account address, chainId, and providerUrl.
 * Chain id + provider url are from the last connected chain for the dApp and wallet. If this has not been set, it will be the default chain and provider.
 */
export function* getAccountRequest(request: RequestAccountRequest, senderTabInfo: SenderTabInfo) {
  const accountInfo = yield* call(saveAccount, senderTabInfo)

  if (!accountInfo) {
    const errorResponse: ErrorResponse = {
      type: DappResponseType.ErrorResponse,
      error: serializeError(providerErrors.unauthorized()),
      requestId: request.requestId,
    }

    yield* call(dappResponseMessageChannel.sendMessageToTab, senderTabInfo.id, errorResponse)
  } else {
    const { dappUrl, activeAccount, connectedAddresses, chainId, providerUrl } = accountInfo

    const accountResponse: AccountResponse = {
      type: DappResponseType.AccountResponse,
      requestId: request.requestId,
      connectedAddresses,
      chainId: chainIdToHexadecimalString(chainId),
      providerUrl,
    }

    yield* call(dappResponseMessageChannel.sendMessageToTab, senderTabInfo.id, accountResponse)

    sendAnalyticsEvent(ExtensionEventName.DappConnectRequest, {
      dappUrl,
      chainId,
      activeConnectedAddress: activeAccount.address,
      connectedAddresses,
    })
  }
}
