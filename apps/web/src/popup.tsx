import React, { lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { logger } from 'wallet/src/features/logger/logger'
import { RootState } from 'wallet/src/state'
import { Store } from 'webext-redux'
import { PortName } from './types'

logger.debug('popup', 'init', 'popup: initial load')

const App = lazy(() => import('./app/App'))

chrome.runtime.connect({ name: PortName.Popup })
chrome.runtime.onMessage.addListener((req) => {
  if (req.type === 'STORE_INITIALIZED') {
    initPopup()
  }
})

function initPopup(): void {
  const store = new Store<RootState>({ portName: PortName.Store })
  // https://github.com/tshaddix/webext-redux/issues/286#issuecomment-1347985776
  Object.assign(store, {
    dispatch: store.dispatch.bind(store),
    getState: store.getState.bind(store),
    subscribe: store.subscribe.bind(store),
  })

  store.ready().then(() => {
    const container = window.document.querySelector('#root')
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const root = createRoot(container!)
    root.render(
      <React.StrictMode>
        <App store={store} />
      </React.StrictMode>
    )
  })
}
