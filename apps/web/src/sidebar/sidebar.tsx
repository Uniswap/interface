// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../index.d.ts" />

import React, { lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { WebState } from 'src/background/store'
import { PortName } from 'src/types'
import { logger } from 'utilities/src/logger/logger'
import { initializeTranslation } from 'wallet/src/i18n/i18n'
import { Store } from 'webext-redux'
;(globalThis as any).regeneratorRuntime = undefined // eslint-disable-line @typescript-eslint/no-explicit-any
// The globalThis.regeneratorRuntime = undefined addresses a potentially unsafe-eval problem
// see https://github.com/facebook/regenerator/issues/378#issuecomment-802628326

logger.debug('content_window', 'init', 'initial load')

const App = lazy(() => import('src/app/SidebarApp'))

chrome.runtime.connect({ name: PortName.Popup })
chrome.runtime.onMessage.addListener(async (req) => {
  if (req.type === 'STORE_INITIALIZED') {
    await initContentWindow()
  }
})

let container: Element | null = null

async function initContentWindow(): Promise<void> {
  if (container) return

  const store = new Store<WebState>({ portName: PortName.Store })
  // https://github.com/tshaddix/webext-redux/issues/286#issuecomment-1347985776
  Object.assign(store, {
    dispatch: store.dispatch.bind(store),
    getState: store.getState.bind(store),
    subscribe: store.subscribe.bind(store),
  })

  await store.ready()

  initializeTranslation()

  container = window.document.querySelector('#root')
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const root = createRoot(container!)
  root.render(
    <React.StrictMode>
      <App store={store} />
    </React.StrictMode>
  )
}
