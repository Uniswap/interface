import 'symbol-observable' // Needed by `reduxed-chrome-storage` as polyfill, order matters
import { AUTO_LOCK_ALARM_NAME } from 'src/app/components/AutoLockProvider'
import { initStatSigForBrowserScripts } from 'src/app/core/initStatSigForBrowserScripts'
import { focusOrCreateOnboardingTab } from 'src/app/navigation/focusOrCreateOnboardingTab'
import { initExtensionAnalytics } from 'src/app/utils/analytics'
import { initMessageBridge } from 'src/background/backgroundDappRequests'
import { backgroundStore } from 'src/background/backgroundStore'
import {
  backgroundToSidePanelMessageChannel,
  contentScriptUtilityMessageChannel,
} from 'src/background/messagePassing/messageChannels'
import {
  BackgroundToSidePanelRequestType,
  ContentScriptUtilityMessageType,
} from 'src/background/messagePassing/types/requests'
import { setSidePanelBehavior, setSidePanelOptions } from 'src/background/utils/chromeSidePanelUtils'
import {
  readDeviceAccessTimeoutMinutesFromStorage,
  readIsOnboardedFromStorage,
} from 'src/background/utils/persistedStateUtils'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { defineBackground } from 'wxt/utils/define-background'

async function enableSidebar(): Promise<void> {
  await setSidePanelOptions({ enabled: true })
  await setSidePanelBehavior({ openPanelOnActionClick: true })
}

async function disableSidebar(): Promise<void> {
  await setSidePanelOptions({ enabled: false })
  await setSidePanelBehavior({ openPanelOnActionClick: false })
}

async function setSidebarState(isOnboarded: boolean): Promise<void> {
  if (isOnboarded) {
    await enableSidebar()
  } else {
    await disableSidebar()
  }
}

async function initApp(): Promise<void> {
  await initStatSigForBrowserScripts()
  await initExtensionAnalytics()

  // Enables or disables sidebar based on onboarding status
  // Injected script will reject any requests if not onboarded
  backgroundStore.addOnboardingChangedListener(async (isOnboarded) => {
    await setSidebarState(isOnboarded)
  })

  // Sets uninstall URL
  chrome.runtime.setUninstallURL(uniswapUrls.chromeExtensionUninstallUrl)

  await backgroundStore.init()
}

function makeBackground(): void {
  let isArcBrowser = false

  initMessageBridge()

  chrome.tabs.onActivated.addListener(onTabChange)
  chrome.tabs.onUpdated.addListener(onTabChange)

  chrome.action.onClicked.addListener(async () => {
    await checkAndHandleOnboarding()
  })

  chrome.runtime.onInstalled.addListener(async () => {
    await checkAndHandleOnboarding()
  })

  // Auto-lock alarm listener
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === AUTO_LOCK_ALARM_NAME) {
      Keyring.lock()
        .then(() => {
          sendAnalyticsEvent(ExtensionEventName.ChangeLockedState, {
            locked: true,
            location: 'background',
          })
        })
        .catch((error) => {
          logger.error(error, {
            tags: {
              file: 'background.ts',
              function: 'alarms.onAlarm',
            },
          })
        })
    }
  })

  // Listen for sidebar port disconnects to schedule auto-lock alarm
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === AUTO_LOCK_ALARM_NAME) {
      port.onDisconnect.addListener(async () => {
        try {
          // Get timeout setting from Redux state
          const delayInMinutes = await readDeviceAccessTimeoutMinutesFromStorage()
          if (delayInMinutes === undefined) {
            return
          }

          // Schedule alarm
          // oxlint-disable-next-line typescript/no-floating-promises -- biome-parity: oxlint is stricter here
          chrome.alarms.create(AUTO_LOCK_ALARM_NAME, { delayInMinutes })
          logger.debug('background', 'port.onDisconnect', `Scheduled auto-lock alarm for ${delayInMinutes} minutes`)
        } catch (error) {
          logger.error(error, {
            tags: {
              file: 'background.ts',
              function: 'port.onDisconnect',
            },
          })
        }
      })
    }
  })

  // on arc browser, show unsupported browser page (lives on onboarding flow)
  // this is because arc doesn't support the sidebar
  contentScriptUtilityMessageChannel.addMessageListener(
    ContentScriptUtilityMessageType.ArcBrowserCheck,
    async (message) => {
      isArcBrowser = !!message.isArcBrowser

      if (message.isArcBrowser) {
        await disableSidebar()
      } else {
        // ensure that we reenable the sidebar if arc styles are not detected
        // but ONLY if the user is actually onboarded
        const isOnboarded = await readIsOnboardedFromStorage()
        if (isOnboarded) {
          await enableSidebar()
        } else {
          await disableSidebar()
        }
      }
    },
  )

  // Utility Functions
  async function checkAndHandleOnboarding(): Promise<void> {
    if (isArcBrowser) {
      await focusOrCreateOnboardingTab()
      return
    }

    const isOnboarded = await readIsOnboardedFromStorage()

    if (isOnboarded) {
      await enableSidebar()
    } else {
      await disableSidebar()
      // Always open onboarding tab when not onboarded
      await focusOrCreateOnboardingTab()
    }
  }

  /** Fires an event whenever a tab is changed so the sidebar can reflect the current connection status properly. */
  async function onTabChange(): Promise<void> {
    try {
      await backgroundToSidePanelMessageChannel.sendMessage({
        type: BackgroundToSidePanelRequestType.TabActivated,
      })
    } catch {
      // an error will be thrown if the sidebar is not open. This is expected and in this case there is no action to be taken anyways so ignore.
    }
  }

  // Relay external messages (from web app passkey popup) to extension tabs.
  // In MV3, onMessageExternal only fires in the service worker, not in extension pages.
  // The onboarding tab needs these messages for the passkey import flow.
  //
  // Security: validate the sender origin before relaying. `externally_connectable` in the
  // manifest gates which origins can reach us at all, but we add a second hostname check
  // here so a future manifest loosening (or a misconfigured dev build) doesn't silently
  // expose the internal message bus to untrusted popups. Listing the staging hosts in
  // every build is intentional: the manifest is the real gate (it only registers them in
  // non-prod), so prod builds reject staging origins because the popup can't connect at
  // all. Keeping a single set here avoids drift between build flavors.
  const ALLOWED_POPUP_HOSTS = new Set(['app.uniswap.org', 'app.corn-staging.com', 'dev.ew.unihq.org'])
  // The chrome.runtime.onMessageExternal API requires the (message, sender, sendResponse)
  // signature for sync replies, so the channel pattern in messageChannels.ts can't carry
  // it. Same reason for the chrome.runtime.sendMessage relay below: TypedRuntimeMessageChannel
  // is fire-and-forget, and we need the response to flow back to the popup.
  // oxlint-disable-next-line max-params
  chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    const senderUrl = sender.url
    if (!senderUrl) {
      return false
    }
    let senderHost: string
    try {
      senderHost = new URL(senderUrl).hostname
    } catch {
      return false
    }
    if (!ALLOWED_POPUP_HOSTS.has(senderHost)) {
      logger.warn('background.ts', 'onMessageExternal', 'rejected relay from unknown origin', { senderHost })
      return false
    }
    // oxlint-disable-next-line eslint-js/no-restricted-syntax -- See comment above re: external popup relay
    chrome.runtime
      .sendMessage(message)
      .then((response) => {
        sendResponse(response)
      })
      .catch((error) => {
        logger.error(error, {
          tags: {
            file: 'background.ts',
            function: 'onMessageExternal',
          },
        })
        // Reply with an error so the popup's awaited sendMessage rejects promptly instead
        // of hanging until chrome's default timeout.
        sendResponse({ error: 'relay failed' })
      })
    // Return true to keep sendResponse channel open for async response
    return true
  })

  initApp().catch((error) => {
    logger.error(error, {
      tags: {
        file: 'background/background.ts',
        function: 'initApp',
      },
    })
  })
}

export default defineBackground({
  type: 'module',
  main() {
    makeBackground()
  },
})
