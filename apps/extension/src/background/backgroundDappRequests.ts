import { rpcErrors, serializeError } from '@metamask/rpc-errors'
import { removeDappConnection } from 'src/app/features/dapp/actions'
import { changeChain } from 'src/app/features/dapp/changeChain'
import { dappStore } from 'src/app/features/dapp/store'
import { SenderTabInfo } from 'src/app/features/dappRequests/slice'
import {
  ChangeChainRequest,
  DappRequest,
  DappRequestType,
  DappResponseType,
  RevokePermissionsRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { focusOrCreateOnboardingTab } from 'src/app/navigation/utils'
import {
  DappBackgroundPortChannel,
  contentScriptToBackgroundMessageChannel,
  contentScriptUtilityMessageChannel,
  createBackgroundToSidePanelMessagePort,
  dappResponseMessageChannel,
} from 'src/background/messagePassing/messageChannels'
import {
  BackgroundToSidePanelRequestType,
  ContentScriptUtilityMessageType,
  DappRequestMessage,
} from 'src/background/messagePassing/types/requests'
import { openSidePanel } from 'src/background/utils/chromeSidePanelUtils'
import { ExtensionEthMethods } from 'src/contentScript/methodHandlers/requestMethods'
import { hexadecimalStringToInt, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants/extension'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WindowEthereumRequestProperties } from 'uniswap/src/features/telemetry/types'
import { extractBaseUrl } from 'utilities/src/format/urls'
import { logger } from 'utilities/src/logger/logger'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { walletContextValue } from 'wallet/src/features/wallet/context'

const INACTIVITY_ALARM_NAME = 'inactivity'
// TODO(EXT-546): add a setting to turn off the auto-lock setting
const INACTIVITY_TIMEOUT_MINUTES = 60 * 24 // 1 day

const windowIdToSidebarPortMap = new Map<string, DappBackgroundPortChannel>()
// TODO EXT-1020 add timeout support to avoid memory leaks
const windowIdToPendingRequestsMap = new Map<string, DappRequestMessage[]>()

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== INACTIVITY_ALARM_NAME) {
    return
  }

  await lockWallet()
})

async function lockWallet(): Promise<void> {
  logger.debug('background', 'lockWallet', 'Locking wallet via background script')
  sendAnalyticsEvent(ExtensionEventName.ChangeLockedState, { locked: true, location: 'background' })
  await Keyring.lock()
}

chrome.runtime.onConnect.addListener(async (port) => {
  await chrome.alarms.clear(INACTIVITY_ALARM_NAME)

  const windowId = port.name
  const portChannel = createBackgroundToSidePanelMessagePort(port)
  windowIdToSidebarPortMap.set(windowId, portChannel)

  const pendingRequests = windowIdToPendingRequestsMap.get(windowId)

  if (pendingRequests) {
    for (const pendingRequest of pendingRequests) {
      await portChannel.sendMessage(pendingRequest)
    }
    windowIdToPendingRequestsMap.delete(windowId)
  }

  // Only gets called when `port.disconnect()` is called or `port.sendMessage()` for a disconnected port
  port.onDisconnect.addListener(async () => {
    windowIdToSidebarPortMap.delete(windowId)

    if (windowIdToSidebarPortMap.size <= 0) {
      await chrome.alarms.create(INACTIVITY_ALARM_NAME, {
        delayInMinutes: INACTIVITY_TIMEOUT_MINUTES,
      })
    }
  })
})

let initialized = false
export function initMessageBridge(): void {
  if (initialized) {
    return
  }

  contentScriptToBackgroundMessageChannel.addAllMessageListener(async (message, sender) => {
    // The side panel needs to be opened here because it has to be in response to a user action.
    // Further down in the chain it will be opened in response to a message from the background script.

    if (sender?.tab?.id === undefined || sender?.tab?.url === undefined) {
      logger.error(new Error('sender.tab id or url is not defined'), {
        tags: {
          file: 'background/background.ts',
          function: 'dappMessageListener',
        },
      })
      return
    }

    const senderTabInfo = {
      id: sender.tab.id,
      url: sender.tab.url,
      favIconUrl: sender.tab.favIconUrl,
    }

    const isSidebarActive = Boolean(windowIdToSidebarPortMap.get(sender.tab.windowId.toString()))
    if (!isSidebarActive) {
      const handled = handleSilentBackgroundRequest(message, senderTabInfo)
      if (handled) {
        return
      }
    }

    await handleSidebarRequest(message, sender.tab.windowId, senderTabInfo)
  })

  contentScriptUtilityMessageChannel.addMessageListener(ContentScriptUtilityMessageType.ErrorLog, async (message) => {
    // Need to re-construct the error object from the message since the error object is not serializable
    logger.error(new Error(message.message), {
      tags: {
        file: message.fileName,
        function: message.functionName,
        ...message.tags,
      },
    })
  })

  contentScriptUtilityMessageChannel.addMessageListener(
    ContentScriptUtilityMessageType.AnalyticsLog,
    async (message) => {
      const properties: WindowEthereumRequestProperties = {
        method: message.tags?.method ?? '',
        dappUrl: message.tags?.dappUrl ?? '',
      }
      const eventName = message.message
      switch (eventName) {
        case ExtensionEventName.UnsupportedMethodRequest:
        case ExtensionEventName.UnrecognizedMethodRequest:
        case ExtensionEventName.DeprecatedMethodRequest:
          sendAnalyticsEvent(eventName, properties)
          break
        default:
          break
      }
    },
  )

  contentScriptUtilityMessageChannel.addMessageListener(ContentScriptUtilityMessageType.FocusOnboardingTab, () => {
    focusOrCreateOnboardingTab().catch((error) =>
      logger.error(error, {
        tags: {
          file: 'backgroundDappRequests.ts',
          function: 'contentScriptUtilityMessageListener',
        },
      }),
    )
  })
  contentScriptUtilityMessageChannel.addMessageListener(ContentScriptUtilityMessageType.FocusOnboardingTab, () => {
    focusOrCreateOnboardingTab().catch((error) =>
      logger.error(error, {
        tags: {
          file: 'backgroundDappRequests.ts',
          function: 'contentScriptUtilityMessageListener',
        },
      }),
    )
  })

  initialized = true
}

/**
 * Dapp requests that should be silently handled by the background worker as a proxy if the sidebar is not open
 * Avoids async to trigger open side panel as quickly as possible
 * @returns true if the request was handled, false otherwise
 */
function handleSilentBackgroundRequest(request: DappRequest, senderTabInfo: SenderTabInfo): boolean {
  const dappUrl = extractBaseUrl(senderTabInfo.url)

  if (!dappUrl) {
    return false
  }

  switch (request.type) {
    case DappRequestType.ChangeChain:
      handleChainChange(request, dappUrl, senderTabInfo.id).catch(() => {})
      return true
    case DappRequestType.RevokePermissions:
      handleRevokePermissions(request, dappUrl, senderTabInfo.id).catch(() => {})
      return true
    default:
      return false
  }
}

async function handleChainChange(request: ChangeChainRequest, dappUrl: string, tabId: number): Promise<void> {
  await dappStore.init()
  const { activeConnectedAddress } = dappStore.getDappInfo(dappUrl) ?? {}
  const updatedChainId = toSupportedChainId(hexadecimalStringToInt(request.chainId))
  const provider = updatedChainId ? walletContextValue.providers.getProvider(updatedChainId) : undefined
  const response = changeChain({
    provider,
    dappUrl,
    updatedChainId,
    requestId: request.requestId,
    activeConnectedAddress,
  })

  await dappResponseMessageChannel.sendMessageToTab(tabId, response)
}

async function handleRevokePermissions(
  request: RevokePermissionsRequest,
  dappUrl: string,
  tabId: number,
): Promise<void> {
  await dappStore.init()
  const revokedPermissions = Object.keys(request.permissions)

  if (revokedPermissions.includes(ExtensionEthMethods.eth_accounts)) {
    await removeDappConnection(dappUrl)
    await dappResponseMessageChannel.sendMessageToTab(tabId, {
      type: DappResponseType.RevokePermissionsResponse,
      requestId: request.requestId,
    })
  } else {
    await dappResponseMessageChannel.sendMessageToTab(tabId, {
      type: DappResponseType.ErrorResponse,
      error: serializeError(rpcErrors.methodNotFound()),
      requestId: request.requestId,
    })
  }
}

class ExpectedNoPortError extends Error {
  constructor() {
    super('No port in storage to post message to')
  }
}

async function handleSidebarRequest(
  request: DappRequest,
  windowId: number,
  senderTabInfo: DappRequestMessage['senderTabInfo'],
): Promise<void> {
  const windowIdString = windowId.toString()
  const portChannel = windowIdToSidebarPortMap.get(windowIdString)
  const message: DappRequestMessage = {
    type: BackgroundToSidePanelRequestType.DappRequestReceived,
    dappRequest: request,
    senderTabInfo,
    isSidebarClosed: !portChannel,
  }

  try {
    if (!portChannel) {
      throw new ExpectedNoPortError()
    }

    await portChannel.sendMessage(message)
  } catch (error) {
    await openSidePanel(senderTabInfo.id, windowId)

    windowIdToPendingRequestsMap.set(windowIdString, windowIdToPendingRequestsMap.get(windowIdString) ?? [])
    windowIdToPendingRequestsMap.get(windowIdString)?.push(message)

    if (!(error instanceof ExpectedNoPortError)) {
      logger.error(error, {
        tags: {
          file: 'backgroundDappRequests.ts',
          function: 'handleSidebarRequest',
        },
      })
    }
  }
}
