import { AnyAction, Dispatch } from 'redux'
import { focusOrCreateOnboardingTab } from 'src/app/navigation/utils'
import {
  BaseDappRequest,
  BaseDappResponse,
  DappRequestType,
} from 'src/background/features/dappRequests/dappRequestTypes'
import { addRequest } from 'src/background/features/dappRequests/saga'
import { isValidMessage, sendRejectionToContentScript } from 'src/background/utils/messageUtils'
import { isOnboardedSelector } from 'src/background/utils/onboardingUtils'
import { PortName } from 'src/types'
import { BackgroundToExtensionRequestType } from 'src/types/requests'
import { logger } from 'utilities/src/logger/logger'
import { authActions } from 'wallet/src/features/auth/saga'
import { AuthActionType } from 'wallet/src/features/auth/types'
import { createStore } from 'wallet/src/state'
import { initializeStore, WebState } from './store'

const INACTIVITY_ALARM_NAME = 'inactivity'
const INACTIVITY_TIMEOUT_MINUTES = 20
const extensionId = chrome.runtime.id

let store: ReturnType<typeof createStore> | undefined

// Track if the user is in the onboarding flow. If they are when the onConnect event fires then
// we need to reinitialize the store for the sidepanel.
let isInOnboarding = false

function isOnboarded(): boolean {
  return (store && isOnboardedSelector(store.getState() as unknown as WebState)) || false
}

// Allows users to open the side panel by clicking on the action toolbar icon
// TODO(EXT-311): the sidepanel flashes when clicking the action item when the onboarding page is open.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) =>
    logger.error(error, { tags: { file: 'background/index.ts', function: 'setPanelBehavior' } })
  )

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== INACTIVITY_ALARM_NAME) return

  store = store || (await initializeStore())
  await store.dispatch(
    authActions.trigger({
      type: AuthActionType.Lock,
    })
  )
})

/** Fires an event whenever a tab is changed so the sidebar can reflect the current connection status properly. */
chrome.tabs.onActivated.addListener(async () => {
  try {
    await chrome.runtime.sendMessage({ type: BackgroundToExtensionRequestType.TabActivated })
  } catch (e) {
    // an error will be thrown if the sidebar is not open. This is expected and in this case there is no action to be taken anyways so ignore.
  }
})

/** Main entrypoint for intializing the app. */
const initApp = async (): Promise<void> => {
  store = await initializeStore()

  initMessageBridge(store.dispatch)
  notifyStoreInitialized()
}

initApp().catch((error) =>
  logger.error(error, { tags: { file: 'background/index.ts', function: 'initApp' } })
)

// onInstalled is triggered when the extension is installed or updated. We want to
// open full screen onboarding when the extension is installed so this listener handles that.
// There is no guarantee that the initApp call at the top level will finish before this handler
// is executed so initApp is called in both places.
chrome.runtime.onInstalled.addListener(async () => {
  if (!store) {
    await initApp()
  }

  await maybeOpenOnboarding()
})

// Listen to incoming connections from content scripts or popup.
// Triggers whenever extension "wakes up" from idle.
// With Manifest V3, we must reinitialize the store from storage each time.
chrome.runtime.onConnect.addListener(async (port) => {
  if (port.name !== PortName.Sidebar) {
    // ignore requests not from known ports
    return
  }

  await chrome.alarms.clear(INACTIVITY_ALARM_NAME)
  port.onDisconnect.addListener(async () => {
    await chrome.alarms.create(INACTIVITY_ALARM_NAME, {
      delayInMinutes: INACTIVITY_TIMEOUT_MINUTES,
    })
  })

  if (isInOnboarding) {
    // If the user is in the onboarding flow then we need to reinitialize the store
    // so that the sidepanel can be connected to the new store.
    isInOnboarding = false
    chrome.runtime.onMessage.removeListener(notOnboardedMessageListener)
    await initApp()
  } else {
    notifyStoreInitialized()
    await maybeOpenOnboarding()
  }
})

async function maybeOpenOnboarding(): Promise<void> {
  if (!isOnboarded()) {
    isInOnboarding = true
    await focusOrCreateOnboardingTab()
  }
}

function notOnboardedMessageListener(
  request: BaseDappRequest,
  sender: chrome.runtime.MessageSender
): void {
  sendRejectionToContentScript(request.requestId, sender.tab?.id)
}

function initMessageBridge(dispatch: Dispatch<AnyAction>): void {
  if (!isOnboarded()) {
    // create a different listener and then remove is once onboarding is completed
    chrome.runtime.onMessage.addListener(notOnboardedMessageListener)
    return
  }

  chrome.runtime.onMessage.addListener(
    (
      request,
      sender: chrome.runtime.MessageSender,
      _sendResponse: (response: BaseDappResponse) => void
    ) => {
      // Validates this is a known request before casting.
      if (
        sender.id !== extensionId ||
        !isValidMessage<BaseDappRequest>(Object.values(DappRequestType), request)
      ) {
        return
      }

      // The side panel needs to be opened here because it has to be in response to a user action.
      // Further down in the chain it will be opened in response to a message from the background script.
      // TODO: remove the cast to any once sidePanel.open is out of beta
      // eslint-disable-next-line security/detect-non-literal-fs-filename, prettier/prettier, @typescript-eslint/no-explicit-any
      (chrome.sidePanel as any).open({ tabId: sender.tab?.id })

      // Dispatches a saga action which will handle side effects as well
      dispatch(
        addRequest({
          dappRequest: request,
          senderTabId: sender.tab?.id || 0,
        })
      )
    }
  )
}

function notifyStoreInitialized(): void {
  chrome.runtime
    .sendMessage({
      type: BackgroundToExtensionRequestType.StoreInitialized,
    })
    .catch(() => undefined)
}
