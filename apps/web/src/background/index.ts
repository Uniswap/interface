import { AnyAction, Dispatch } from 'redux'
import { focusOrCreateOnboardingTab } from 'src/app/navigation/utils'
import {
  BaseDappRequest,
  BaseDappResponse,
  DappRequestType,
} from 'src/background/features/dappRequests/dappRequestTypes'
import { addRequest } from 'src/background/features/dappRequests/saga'
import { isOnboardedSelector } from 'src/background/utils/onboardingUtils'
import { PortName } from 'src/types'
import { logger } from 'utilities/src/logger/logger'
import { authActions } from 'wallet/src/features/auth/saga'
import { AuthActionType } from 'wallet/src/features/auth/types'
import { createStore } from 'wallet/src/state'
import { initializeStore, WebState } from './store'

const INACTIVITY_ALARM_NAME = 'inactivity'
const INACTIVITY_TIMEOUT_MINUTES = 20

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

function initMessageBridge(dispatch: Dispatch<AnyAction>): void {
  if (!isOnboarded()) {
    return
  }

  chrome.runtime.onMessage.addListener(
    (
      request: unknown,
      sender: chrome.runtime.MessageSender,
      _sendResponse: (response: BaseDappResponse) => void
    ) => {
      // Validates this is a known request before casting.
      if (
        !('type' in (request as Partial<BaseDappRequest>)) ||
        !Object.values(DappRequestType).includes((request as BaseDappRequest).type)
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
          dappRequest: request as BaseDappRequest,
          senderTabId: sender.tab?.id || 0,
        })
      )
    }
  )
}

function notifyStoreInitialized(): void {
  chrome.runtime
    .sendMessage({
      type: 'STORE_INITIALIZED',
    })
    .catch(() => undefined)
}
