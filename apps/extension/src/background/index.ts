import { PortName } from '../types'
import { createStore } from 'app/src/state'
import { aliases } from './aliases'
import { alias, wrapStore } from 'webext-redux'

console.log('background: init')

// Since we are in a service worker, this is not persistent
// and this will be reset to false, as expected, whenever
// the service worker wakes up from idle.
const isInitialized = false

initStore()

function initStore() {
  // Listen to incoming connections from content scripts or popup.
  // Triggers whenever extension "wakes up" from idle.
  // With Manifest V3, we must reinitialize the store from storage each time.
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === PortName.Popup) {
      chrome.storage.local.get('state', (storage) => {
        if (!isInitialized) {
          const beforeMiddleware = [alias(aliases)]

          const store = createStore({
            preloadedState: storage.state,
            beforeMiddleware,
          })

          wrapStore(store, { portName: PortName.Store })
        }

        // 2. sends a message to notify store is ready
        chrome.runtime.sendMessage({
          type: 'STORE_INITIALIZED',
        })
      })
    }
  })
}