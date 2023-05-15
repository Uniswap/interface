import { AnyAction, Dispatch } from 'redux'
import { BaseDappResponse, DappRequestType } from 'src/features/dappRequests/dappRequestTypes'
import { addRequest } from 'src/features/dappRequests/saga'
import { PortName } from 'src/types'
import { isOnboardedSelector } from 'wallet/src/features/wallet/selectors'
import { initializeStore, WebState } from './store'

// Since we are in a service worker, this is not persistent and this will be
// reset to false, as expected, whenever the service worker wakes up from idle.
let isInitialized = false

/** Main entrypoint for intiializing the app. */
const initApp = async (): Promise<undefined> => {
  if (isInitialized) {
    notifyStoreInitialized()
    return
  }

  isInitialized = true

  const store = await initializeStore()

  if (store) {
    maybeOpenOnboarding(store.getState() as unknown as WebState, store.dispatch)
    notifyStoreInitialized()
  }
}

// onInstalled is triggered when the extension is installed or updated. We want to
// open full screen onboarding when the extension is installed so this listener handles that.
chrome.runtime.onInstalled.addListener(() => {
  initApp()
})

// Listen to incoming connections from content scripts or popup.
// Triggers whenever extension "wakes up" from idle.
// With Manifest V3, we must reinitialize the store from storage each time.
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== PortName.Popup && port.name !== PortName.ContentScript) {
    // ignore requests not from known ports
    return
  }

  initApp()
})

function maybeOpenOnboarding(state: WebState, dispatch: Dispatch<AnyAction>): void {
  const isOnboarded = isOnboardedSelector(state)

  if (!isOnboarded) {
    chrome.tabs.create({ url: 'index.html#/onboarding' })
  }

  chrome.runtime.onMessage.addListener(
    (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request: any,
      sender: chrome.runtime.MessageSender,
      _sendResponse: (response: BaseDappResponse) => void
    ) => {
      // The type above for request doesn't guarantee that the type is SendTransactionRequest
      if (!Object.values(DappRequestType).includes(request.type)) return

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
      type: 'STORE_INITIALIZED',
    })
    .catch(() => undefined)
}
