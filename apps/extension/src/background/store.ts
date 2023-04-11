import { createStore } from 'app/src/state'
import { wrapStore } from 'webext-redux'
import { PortName } from '../types'

// Since we are in a service worker, this is not persistent
// and this will be reset to false, as expected, whenever
// the service worker wakes up from idle.
let isInitialized = false

export function initStore() {
  // Listen to incoming connections from content scripts or popup.
  // Triggers whenever extension "wakes up" from idle.
  // With Manifest V3, we must reinitialize the store from storage each time.
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== PortName.Popup) {
      // ignore requests not from known ports
      return
    }

    onConnect()
  })
}

function onConnect() {
  if (isInitialized) {
    notifyStoreInitialized()
    return
  }

  const store = createStore({
    hydrationCallback: notifyStoreInitialized,
  })

  // wraps store in webext-redux
  wrapStore(store, { portName: PortName.Store })

  isInitialized = true
}

function notifyStoreInitialized(): void {
  chrome.runtime
    .sendMessage({
      type: 'STORE_INITIALIZED',
    })
    .catch(() => undefined)
}
