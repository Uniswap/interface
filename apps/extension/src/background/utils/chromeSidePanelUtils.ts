import { focusOrCreateDappRequestWindow } from 'src/app/navigation/utils'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'

export async function openSidePanel(tabId: number | undefined, windowId: number): Promise<void> {
  let hasError = false
  try {
    // Chrome API accepts either tabId or windowId, prefer tabId for specific tab targeting
    if (tabId !== undefined) {
      await chrome.sidePanel.open({ tabId })
    } else {
      await chrome.sidePanel.open({ windowId })
    }
  } catch (error) {
    // TODO WALL-4313 - Backup for some broken chrome.sidePanel.open functionality
    // Consider removing this once the issue is resolved or leaving as fallback
    await focusOrCreateDappRequestWindow(tabId, windowId)

    hasError = true
    logger.error(error, {
      tags: {
        file: 'background/background.ts',
        function: 'openSidebar',
      },
    })
  } finally {
    sendAnalyticsEvent(ExtensionEventName.BackgroundAttemptedToOpenSidebar, { hasError })
  }
}

export async function setSidePanelBehavior(behavior: chrome.sidePanel.PanelBehavior): Promise<void> {
  try {
    await chrome.sidePanel.setPanelBehavior(behavior)
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'background/background.ts',
        function: 'setSideBarBehavior',
      },
    })
  }
}

export async function setSidePanelOptions(options: chrome.sidePanel.PanelOptions): Promise<void> {
  try {
    await chrome.sidePanel.setOptions(options)
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'background/background.ts',
        function: 'setSideBarOptions',
      },
    })
  }
}
