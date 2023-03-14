import React, { lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { Store } from 'webext-redux'
import { RootState } from 'app/src/state'
import { PortName } from './types'
import { logger } from 'app/src/features/logger/logger'

logger.debug('popup', 'init', 'popup: initial load')

const App = lazy(() => import('./app/App'))

chrome.runtime.connect({ name: PortName.Popup })
chrome.runtime.onMessage.addListener((req) => {
  logger.debug('popup', 'listener', `Received ${req.type}`)

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
        <Provider store={store}>
          <App />
        </Provider>
      </React.StrictMode>
    )
  })
}
