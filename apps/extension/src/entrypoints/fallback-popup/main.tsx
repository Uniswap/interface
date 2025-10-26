// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../../index.d.ts" />
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../.wxt/wxt.d.ts" />

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PopupApp from 'src/app/core/PopupApp'
import { initializeReduxStore } from 'src/store/store'
// biome-ignore lint/suspicious/noExplicitAny: Global polyfill cleanup requires any type for runtime modification
;(globalThis as any).regeneratorRuntime = undefined

function makeFallbackPopup(): void {
  function initFallbackPopup() {
    // biome-ignore lint/style/noNonNullAssertion: popup root element guaranteed to exist in extension
    const container = document.getElementById('fallback-popup-root')!
    const root = createRoot(container)

    root.render(
      <StrictMode>
        <PopupApp />
      </StrictMode>,
    )
  }

  initializeReduxStore({ readOnly: true })
  initFallbackPopup()
}

makeFallbackPopup()
