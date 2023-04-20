import {
  BaseDappResponse,
  DappRequestType,
} from 'app/src/features/dappRequests/dappRequestTypes'
import { addRequest } from 'app/src/features/dappRequests/saga'
import { isOnboardedSelector } from 'app/src/features/wallet/selectors'
import { createStore } from 'app/src/state'
import { wrapStore } from 'webext-redux'
import { PortName } from '../types/index'

// Since we are in a service worker, this is not persistent
// and this will be reset to false, as expected, whenever
// the service worker wakes up from idle.
let isInitialized = false

// onInstalled is triggered when the extension is installed or updated. We want to 
// open full screen onboarding when the extension is installed so this listener handles that.
chrome.runtime.onInstalled.addListener(() => {
  initializeStore()
})

// TODO: Look into using web-ext-redux instead for this:

// Listen to incoming connections from content scripts or popup.
// Triggers whenever extension "wakes up" from idle.
// With Manifest V3, we must reinitialize the store from storage each time.
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== PortName.Popup && port.name !== PortName.ContentScript) {
    // ignore requests not from known ports
    return
  }

  initializeStore()
})

function initializeStore() {
  if (isInitialized) {
    notifyStoreInitialized()
    return
  }

  const store = createStore({
    hydrationCallback: openOnboardingMaybe,
  })

  function openOnboardingMaybe(): void {
    const state = store.getState()
    const isOnboarded = isOnboardedSelector(state)

    if (!isOnboarded) {
      chrome.tabs.create({ url: 'index.html#/onboarding' })
    }

    notifyStoreInitialized()
  }

  // wraps store in webext-redux
  wrapStore(store, { portName: PortName.Store })

  isInitialized = true

  // https://github.com/tshaddix/webext-redux/issues/286#issuecomment-1347985776
  Object.assign(store, {
    dispatch: store.dispatch.bind(store),
    getState: store.getState.bind(store),
    subscribe: store.subscribe.bind(store),
  })

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
      store.dispatch(
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
