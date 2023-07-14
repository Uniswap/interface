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
import { initializeStore, WebState } from './store'

// Since we are in a service worker, this is not persistent and this will be
// reset to false, as expected, whenever the service worker wakes up from idle.
let isInitialized = false

/** Main entrypoint for intializing the app. */
const initApp = async ({
  openOnboardingIfNotOnboarded = false,
}: {
  openOnboardingIfNotOnboarded?: boolean
}): Promise<void> => {
  if (isInitialized) {
    notifyStoreInitialized()
    return
  }

  isInitialized = true

  const store = await initializeStore()

  if (!store) {
    return
  }

  initMessageBridge(store.dispatch)
  notifyStoreInitialized()

  if (openOnboardingIfNotOnboarded) {
    await maybeOpenOnboarding(store.getState() as unknown as WebState)
  }
}

// onInstalled is triggered when the extension is installed or updated. We want to
// open full screen onboarding when the extension is installed so this listener handles that.
chrome.runtime.onInstalled.addListener(async () => {
  await initApp({ openOnboardingIfNotOnboarded: true })
})

// Listen to incoming connections from content scripts or popup.
// Triggers whenever extension "wakes up" from idle.
// With Manifest V3, we must reinitialize the store from storage each time.
chrome.runtime.onConnect.addListener(async (port) => {
  if (port.name !== PortName.Popup && port.name !== PortName.ContentScript) {
    // ignore requests not from known ports
    return
  }

  // The popup will handle opening the onboarding page if needed, so we do not need to open it here.
  await initApp({})
})

async function maybeOpenOnboarding(state: WebState): Promise<void> {
  const isOnboarded = isOnboardedSelector(state)

  if (!isOnboarded) {
    await focusOrCreateOnboardingTab()
  }
}

function initMessageBridge(dispatch: Dispatch<AnyAction>): void {
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
