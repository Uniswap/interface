/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { JsonRpcProvider } from '@ethersproject/providers'
import { providerErrors, serializeError } from '@metamask/rpc-errors'
import { saveDappConnection } from 'src/app/features/dapp/actions'
import { DappInfo, dappStore } from 'src/app/features/dapp/store'
import { getOrderedConnectedAddresses } from 'src/app/features/dapp/utils'
import { SenderTabInfo } from 'src/app/features/dappRequests/slice'
import {
  AccountResponse,
  DappRequest,
  DappResponseType,
  ErrorResponse,
  GetAccountRequest,
  RequestAccountRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { extractBaseUrl } from 'src/app/features/dappRequests/utils'
import { dappResponseMessageChannel } from 'src/background/messagePassing/messageChannels'
import { call, put } from 'typed-redux-saga'
import { chainIdToHexadecimalString } from 'uniswap/src/features/chains/utils'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { getProvider } from 'wallet/src/features/wallet/context'
import { selectActiveAccount } from 'wallet/src/features/wallet/selectors'
import { appSelect } from 'wallet/src/state'

function getAccountResponse(
  chainId: WalletChainId,
  dappRequest: DappRequest,
  provider: JsonRpcProvider,
  dappInfo: DappInfo,
): AccountResponse {
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

function sendAccountResponseAnalyticsEvent(
  senderUrl: string,
  chainId: WalletChainId,
  dappInfo: DappInfo,
  accountResponse: AccountResponse,
): void {
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
export function* getAccount(
  dappRequest: GetAccountRequest | RequestAccountRequest,
  { id, url }: SenderTabInfo,
  dappInfo: DappInfo,
) {
  const chainId = dappInfo.lastChainId
  const provider = yield* call(getProvider, chainId)

  const response = getAccountResponse(chainId, dappRequest, provider, dappInfo)
  sendAccountResponseAnalyticsEvent(url, chainId, dappInfo, response)

  yield* call(dappResponseMessageChannel.sendMessageToTab, id, response)
}

/**
 * Saves the active account as connected to the dapp and parses out necessary data
 * Triggers a notification for new connections
 */
export function* saveAccount({ url, favIconUrl }: SenderTabInfo) {
  const activeAccount = yield* appSelect(selectActiveAccount)
  const dappUrl = extractBaseUrl(url)
  const dappInfo = yield* call(dappStore.getDappInfo, dappUrl)

  if (!dappUrl || !activeAccount) {
    return
  }

  yield* call(saveDappConnection, dappUrl, activeAccount)
  // No dapp info means that this is a first time connection request
  if (!dappInfo) {
    yield* put(
      pushNotification({
        type: AppNotificationType.DappConnected,
        dappIconUrl: favIconUrl,
      }),
    )
  }

  const chainId = dappInfo?.lastChainId ?? UniverseChainId.Mainnet
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
    const errorReponse: ErrorResponse = {
      type: DappResponseType.ErrorResponse,
      error: serializeError(providerErrors.unauthorized()),
      requestId: request.requestId,
    }

    yield* call(dappResponseMessageChannel.sendMessageToTab, senderTabInfo.id, errorReponse)
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
