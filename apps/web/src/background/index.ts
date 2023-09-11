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
import { initializeStore, WebState } from './store'

// Since we are in a service worker, this is not persistent and this will be
// reset to false, as expected, whenever the service worker wakes up from idle.
let isInitialized = false

// Allows users to open the side panel by clicking on the action toolbar icon
// TODO(EXT-311): move this until after onboarding is completed so the sidepanel doesn't flash when clicking the action item when the onboarding page is open.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) =>
    logger.error(error, { tags: { file: 'background/index.ts', function: 'setPanelBehavior' } })
  )

// TODO(EXT-285): if the service worker goes to sleep mid onboarding then we get an error.
// it likely needs to wait for the store to be initialized.
/** Main entrypoint for intializing the app. */
const initApp = async (): Promise<void> => {
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

  await maybeOpenOnboarding({
    state: store.getState() as unknown as WebState,
    dispatch: store.dispatch,
  })
}

initApp().catch((error) =>
  logger.error(error, { tags: { file: 'background/index.ts', function: 'initApp' } })
)

// onInstalled is triggered when the extension is installed or updated. We want to
// open full screen onboarding when the extension is installed so this listener handles that.
// There is no guarantee that the initApp call at the top level will finish before this handler
// is executed so initApp is called in both places.
chrome.runtime.onInstalled.addListener(async () => {
  await initApp()
})

// Listen to incoming connections from content scripts or popup.
// Triggers whenever extension "wakes up" from idle.
// With Manifest V3, we must reinitialize the store from storage each time.
chrome.runtime.onConnect.addListener(async (port) => {
  if (port.name !== PortName.Popup && port.name !== PortName.ContentScript) {
    // ignore requests not from known ports
    return
  }

  notifyStoreInitialized()
})

async function maybeOpenOnboarding({
  state,
  dispatch,
}: {
  state: WebState
  dispatch: Dispatch<AnyAction>
}): Promise<void> {
  const isOnboarded = isOnboardedSelector(state)

  if (!isOnboarded) {
    await focusOrCreateOnboardingTab({ dispatch })
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
