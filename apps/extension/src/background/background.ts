import 'symbol-observable' // Needed by `reduxed-chrome-storage` as polyfill, order matters

import { initStatSigForBrowserScripts } from 'src/app/core/StatsigProvider'
import { focusOrCreateOnboardingTab } from 'src/app/navigation/utils'
import { initExtensionAnalytics } from 'src/app/utils/analytics'
import { initMessageBridge } from 'src/background/backgroundDappRequests'
import { backgroundStore } from 'src/background/backgroundStore'
import { backgroundToSidePanelMessageChannel } from 'src/background/messagePassing/messageChannels'
import { BackgroundToSidePanelRequestType } from 'src/background/messagePassing/types/requests'
import { setSidePanelBehavior, setSidePanelOptions } from 'src/background/utils/chromeSidePanelUtils'
import { readIsOnboardedFromStorage } from 'src/background/utils/persistedStateUtils'
import { logger } from 'utilities/src/logger/logger'

initMessageBridge()

async function initApp(): Promise<void> {
  await initStatSigForBrowserScripts()
  await initExtensionAnalytics()

  // Enables or disables sidebar based on onboarding status
  // Injected script will reject any requests if not onboarded
  backgroundStore.addOnboardingChangedListener(async (isOnboarded) => {
    if (isOnboarded) {
      await enableSidebar()
    } else {
      await disableSidebar()
      await focusOrCreateOnboardingTab()
    }
  })

  await backgroundStore.init()
}

chrome.tabs.onActivated.addListener(onTabChange)
chrome.tabs.onUpdated.addListener(onTabChange)

chrome.action.onClicked.addListener(async () => {
  await checkAndHandleOnboarding()
})

chrome.runtime.onInstalled.addListener(async () => {
  await checkAndHandleOnboarding()
})

// Utility Functions
async function checkAndHandleOnboarding(): Promise<void> {
  const isOnboarded = await readIsOnboardedFromStorage()

  if (!isOnboarded) {
    await disableSidebar()
    await focusOrCreateOnboardingTab()
  } else {
    await enableSidebar()
  }
}

async function enableSidebar(): Promise<void> {
  await setSidePanelOptions({ enabled: true })
  await setSidePanelBehavior({ openPanelOnActionClick: true })
}

async function disableSidebar(): Promise<void> {
  await setSidePanelOptions({ enabled: false })
  await setSidePanelBehavior({ openPanelOnActionClick: false })
}

/** Fires an event whenever a tab is changed so the sidebar can reflect the current connection status properly. */
async function onTabChange(): Promise<void> {
  try {
    await backgroundToSidePanelMessageChannel.sendMessage({
      type: BackgroundToSidePanelRequestType.TabActivated,
    })
  } catch (e) {
    // an error will be thrown if the sidebar is not open. This is expected and in this case there is no action to be taken anyways so ignore.
  }
}

initApp().catch((error) => {
  logger.error(error, {
    tags: {
      file: 'background/background.ts',
      function: 'initApp',
    },
  })
})
