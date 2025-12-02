/* eslint-disable max-lines */
import { rpcErrors, serializeError } from '@metamask/rpc-errors'
import { removeDappConnection } from 'src/app/features/dapp/actions'
import { changeChain } from 'src/app/features/dapp/changeChain'
import { dappStore } from 'src/app/features/dapp/store'
import type { SenderTabInfo } from 'src/app/features/dappRequests/shared'
import {
  ChangeChainRequest,
  DappRequest,
  GetCapabilitiesRequest,
  RevokePermissionsRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { focusOrCreateOnboardingTab } from 'src/app/navigation/focusOrCreateOnboardingTab'
import { focusOrCreateDappRequestWindow } from 'src/app/navigation/utils'
import {
  contentScriptToBackgroundMessageChannel,
  contentScriptUtilityMessageChannel,
  createBackgroundToSidePanelMessagePort,
  DappBackgroundPortChannel,
  dappResponseMessageChannel,
} from 'src/background/messagePassing/messageChannels'
import {
  BackgroundToSidePanelRequestType,
  ContentScriptUtilityMessageType,
  DappRequestMessage,
} from 'src/background/messagePassing/types/requests'
import { checkAreMigrationsPending, readReduxStateFromStorage } from 'src/background/utils/persistedStateUtils'
import { getFeatureFlaggedChainIds } from 'uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds'
import { getEnabledChains, hexadecimalStringToInt, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { DappRequestType, DappResponseType, EthMethod } from 'uniswap/src/features/dappRequests/types'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WindowEthereumRequestProperties } from 'uniswap/src/features/telemetry/types'
import { extractBaseUrl } from 'utilities/src/format/urls'
import { logger } from 'utilities/src/logger/logger'
import { getCapabilitiesCore } from 'wallet/src/features/batchedTransactions/utils'
import { walletContextValue } from 'wallet/src/features/wallet/context'
import { selectHasSmartWalletConsent } from 'wallet/src/features/wallet/selectors'

// Request classification constants for determining which requests need user interaction
const REQUEST_CLASSIFICATION = {
  interactive: new Set([
    DappRequestType.RequestAccount,
    DappRequestType.SendTransaction,
    DappRequestType.SignMessage,
    DappRequestType.SignTypedData,
    DappRequestType.UniswapOpenSidebar,
    DappRequestType.RequestPermissions,
    DappRequestType.SendCalls,
  ]),
  silent: new Set([DappRequestType.ChangeChain, DappRequestType.RevokePermissions, DappRequestType.GetCapabilities]),
} as const

const windowIdToSidebarPortMap = new Map<string, DappBackgroundPortChannel>()
// TODO EXT-1020 add timeout support to avoid memory leaks
const windowIdToPendingRequestsMap = new Map<string, DappRequestMessage[]>()

chrome.runtime.onConnect.addListener(async (port) => {
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
  })
})

let initialized = false
export function initMessageBridge(): void {
  if (initialized) {
    return
  }

  contentScriptToBackgroundMessageChannel.addAllMessageListener((message, sender) => {
    // CRITICAL: This listener must NOT be async to preserve user gesture context.
    // Chrome's sidePanel.open() API requires execution within ~1ms of a user gesture.
    // Using async/await here breaks the gesture context and causes the error:
    // "sidePanel.open() may only be called in response to a user gesture"

    // Validate sender has required information
    if (!isValidSender(sender)) {
      logger.error(new Error('sender.tab id or url is not defined'), {
        tags: {
          file: 'backgroundDappRequests.ts',
          function: 'dappMessageListener',
        },
      })
      return
    }

    const requestType = message.type
    const windowId = sender.tab.windowId
    const windowIdString = windowId.toString()
    const isSidebarActive = Boolean(windowIdToSidebarPortMap.get(windowIdString))

    // CRITICAL: Open side panel synchronously to preserve user gesture context.
    // This must happen immediately, before any async operations.
    if (requiresSidePanel(requestType) && !isSidebarActive) {
      openSidePanelSync({
        tabId: sender.tab.id,
        windowId,
        onSuccess: () => {
          // Process request after panel opens (async operations safe here)
          handleRequestAsync({ message, sender })
        },
        onError: (error, fallbackOpened) => {
          // Panel failed to open, but fallback might have succeeded
          logger.error(error, {
            tags: {
              file: 'backgroundDappRequests.ts',
              function: 'initMessageBridge',
            },
            extra: {
              action: 'openSidePanel',
              fallbackOpened,
            },
          })

          // Revalidate sender in error callback context
          if (!isValidSender(sender)) {
            logger.error(new Error('Sender tab info unexpectedly invalid in error callback'), {
              tags: {
                file: 'backgroundDappRequests.ts',
                function: 'initMessageBridge',
              },
            })
            return
          }

          // Queue the message for when panel/popup eventually connects
          // This works for both side panel and popup window
          queueMessageForPanel({
            windowId,
            message,
            senderTabInfo: {
              id: sender.tab.id,
              url: sender.tab.url,
              favIconUrl: sender.tab.favIconUrl,
            },
          })
        },
      })
    } else {
      // Non-interactive request or panel already open - async handling is safe
      handleRequestAsync({ message, sender })
    }
  })

  contentScriptUtilityMessageChannel.addMessageListener(ContentScriptUtilityMessageType.ErrorLog, async (message) => {
    // Need to re-construct the error object from the message since the error object is not serializable
    logger.error(new Error(message.message), {
      tags: {
        file: message.fileName,
        function: message.functionName,
        ...message.tags,
      },
      extra: message.extra,
    })
  })

  contentScriptUtilityMessageChannel.addMessageListener(
    ContentScriptUtilityMessageType.AnalyticsLog,
    async (message) => {
      const properties: WindowEthereumRequestProperties = {
        method: message.tags.method ?? '',
        dappUrl: message.tags.dappUrl ?? '',
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

  initialized = true
}

/**
 * Dapp requests that should be silently handled by the background worker as a proxy if the sidebar is not open
 * @returns true if the request was handled, false otherwise
 */
async function handleSilentBackgroundRequest(request: DappRequest, senderTabInfo: SenderTabInfo): Promise<boolean> {
  const dappUrl = extractBaseUrl(senderTabInfo.url)

  if (!dappUrl) {
    return false
  }

  // Check for pending migrations before attempting silent handling
  const migrationsPending = await checkAreMigrationsPending()
  if (migrationsPending) {
    logger.debug(
      'backgroundDappRequests',
      'handleSilentBackgroundRequest',
      'Migrations pending, skipping silent handling',
    )
    return false
  }

  // Only proceed with silent handling if no migrations are pending
  switch (request.type) {
    case DappRequestType.ChangeChain:
      handleChainChange({
        request,
        dappUrl,
        tabId: senderTabInfo.id,
      }).catch(() => {})
      return true
    case DappRequestType.RevokePermissions:
      handleRevokePermissions({
        request,
        dappUrl,
        tabId: senderTabInfo.id,
      }).catch(() => {})
      return true
    case DappRequestType.GetCapabilities:
      handleGetCapabilities({
        request,
        tabId: senderTabInfo.id,
      }).catch(() => {})
      return true
    default:
      return false
  }
}

async function handleChainChange({
  request,
  dappUrl,
  tabId,
}: {
  request: ChangeChainRequest
  dappUrl: string
  tabId: number
}): Promise<void> {
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

async function handleRevokePermissions({
  request,
  dappUrl,
  tabId,
}: {
  request: RevokePermissionsRequest
  dappUrl: string
  tabId: number
}): Promise<void> {
  await dappStore.init()
  const revokedPermissions = Object.keys(request.permissions)

  if (revokedPermissions.includes(EthMethod.EthAccounts)) {
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

async function handleGetCapabilities({
  request,
  tabId,
}: {
  request: GetCapabilitiesRequest
  tabId: number
}): Promise<void> {
  try {
    // Get enabled chains using the same logic as the saga
    const reduxState = await readReduxStateFromStorage()
    const hasSmartWalletConsent = reduxState ? selectHasSmartWalletConsent(reduxState, request.address) : false
    const isTestnetModeEnabled = reduxState ? (reduxState.userSettings.isTestnetModeEnabled ?? false) : false
    const featureFlaggedChainIds = getFeatureFlaggedChainIds()
    const { chains: enabledChains } = getEnabledChains({
      isTestnetModeEnabled,
      featureFlaggedChainIds,
    })

    const chainIds = request.chainIds?.map(hexadecimalStringToInt) ?? enabledChains.map((chain) => chain.valueOf())
    const response = await getCapabilitiesCore({
      request,
      chainIds,
      hasSmartWalletConsent,
    })

    await dappResponseMessageChannel.sendMessageToTab(tabId, response)
  } catch (error) {
    logger.error(error, {
      tags: { file: 'backgroundDappRequests.ts', function: 'handleGetCapabilities' },
      extra: { request },
    })

    // Send error response on failure
    await dappResponseMessageChannel.sendMessageToTab(tabId, {
      type: DappResponseType.ErrorResponse,
      error: serializeError(rpcErrors.internal()),
      requestId: request.requestId,
    })
  }
}

/**
 * Handles dapp requests asynchronously after the side panel has been opened (if needed).
 * This function contains the original async logic that was previously in the message listener.
 * Moving it here allows us to open the side panel synchronously while preserving all existing behavior.
 */
async function handleRequestAsync({
  message,
  sender,
}: {
  message: DappRequest
  sender: chrome.runtime.MessageSender
}): Promise<void> {
  // Revalidate sender
  if (!isValidSender(sender)) {
    logger.error(new Error('Invalid sender tab info in handleRequestAsync'), {
      tags: {
        file: 'backgroundDappRequests.ts',
        function: 'handleRequestAsync',
      },
      extra: {
        hasTab: !!sender.tab,
        hasId: sender.tab?.id !== undefined,
        hasUrl: !!sender.tab?.url,
      },
    })
    return
  }

  const senderTabInfo: SenderTabInfo = {
    id: sender.tab.id,
    url: sender.tab.url,
    favIconUrl: sender.tab.favIconUrl,
  }

  const windowId = sender.tab.windowId
  const windowIdString = windowId.toString()
  const isSidebarActive = Boolean(windowIdToSidebarPortMap.get(windowIdString))

  // Try to handle silently if sidebar is not active
  if (!isSidebarActive) {
    const handled = await handleSilentBackgroundRequest(message, senderTabInfo)
    if (handled) {
      return
    }
  }

  // Handle via sidebar (queue message for processing)
  await handleSidebarRequest({
    request: message,
    windowId,
    senderTabInfo,
  })
}

async function handleSidebarRequest({
  request,
  windowId,
  senderTabInfo,
}: {
  request: DappRequest
  windowId: number
  senderTabInfo: DappRequestMessage['senderTabInfo']
}): Promise<void> {
  const windowIdString = windowId.toString()
  const portChannel = windowIdToSidebarPortMap.get(windowIdString)
  const message: DappRequestMessage = {
    type: BackgroundToSidePanelRequestType.DappRequestReceived,
    dappRequest: request,
    senderTabInfo,
    isSidebarClosed: !portChannel,
  }

  if (portChannel) {
    // Port exists, send message directly
    try {
      await portChannel.sendMessage(message)
    } catch (error) {
      logger.error(error, {
        tags: {
          file: 'backgroundDappRequests.ts',
          function: 'handleSidebarRequest',
        },
      })
      // Queue message if send fails
      queueMessageForPanel({ windowId, message: request, senderTabInfo })
    }
  } else {
    // IMPORTANT: No port channel means the panel is opening or about to open.
    // We do NOT call openSidePanel here because it was already opened synchronously
    // in the message listener to preserve the user gesture context.
    // Just queue the message - it will be processed when the panel connects.
    queueMessageForPanel({ windowId, message: request, senderTabInfo })
  }
}

/**
 * Determines if a request requires the side panel to be opened for user interaction
 */
function requiresSidePanel(requestType: DappRequestType): boolean {
  return REQUEST_CLASSIFICATION.interactive.has(requestType)
}

/**
 * Validates that the sender has all required tab information
 */
function isValidSender(sender?: chrome.runtime.MessageSender): sender is chrome.runtime.MessageSender & {
  tab: chrome.tabs.Tab & { id: number; url: string }
} {
  return sender?.tab?.id !== undefined && sender.tab.url !== undefined
}

/**
 * Opens the side panel synchronously to preserve user gesture context.
 * Must be called within ~1ms of user gesture.
 * Falls back to opening a popup window if side panel fails.
 */
function openSidePanelSync({
  tabId,
  windowId,
  onSuccess,
  onError,
}: {
  tabId: number
  windowId: number
  onSuccess: () => void
  onError: (error: chrome.runtime.LastError, fallbackOpened: boolean) => void
}): void {
  chrome.sidePanel.open({ tabId }, () => {
    const lastError = chrome.runtime.lastError
    if (lastError) {
      // Try fallback to popup window - still in sync callback to preserve gesture
      focusOrCreateDappRequestWindow(tabId, windowId)
        .then(() => {
          // Fallback succeeded - notify that we opened a window instead
          onError(lastError, true)
        })
        .catch((fallbackError) => {
          // Even fallback failed
          logger.error(fallbackError, {
            tags: {
              file: 'backgroundDappRequests.ts',
              function: 'openSidePanelSync',
            },
            extra: { action: 'fallbackToPopupWindow' },
          })
          onError(lastError, false)
        })
    } else {
      onSuccess()
    }
  })
}

/**
 * Queues a message for processing when the side panel connects
 */
function queueMessageForPanel({
  windowId,
  message,
  senderTabInfo,
}: {
  windowId: number
  message: DappRequest
  senderTabInfo: SenderTabInfo
}): void {
  const windowIdString = windowId.toString()

  if (!windowIdToPendingRequestsMap.has(windowIdString)) {
    windowIdToPendingRequestsMap.set(windowIdString, [])
  }

  const queuedMessage: DappRequestMessage = {
    type: BackgroundToSidePanelRequestType.DappRequestReceived,
    dappRequest: message,
    senderTabInfo,
    isSidebarClosed: true,
  }

  windowIdToPendingRequestsMap.get(windowIdString)?.push(queuedMessage)
}
