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
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { walletContextValue } from 'wallet/src/features/wallet/context'
import { selectHasSmartWalletConsent } from 'wallet/src/features/wallet/selectors'

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

    if (sender?.tab?.id === undefined || sender.tab.url === undefined) {
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
      const handled = await handleSilentBackgroundRequest(message, senderTabInfo)
      if (handled) {
        return
      }
    }

    await handleSidebarRequest({
      request: message,
      windowId: sender.tab.windowId,
      senderTabInfo,
    })
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
    const isTestnetModeEnabled = reduxState ? reduxState.userSettings.isTestnetModeEnabled ?? false : false
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

class ExpectedNoPortError extends Error {
  constructor() {
    super('No port in storage to post message to')
  }
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
