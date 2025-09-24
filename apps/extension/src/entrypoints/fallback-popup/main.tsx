// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../../index.d.ts" />
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../.wxt/wxt.d.ts" />

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PopupApp from 'src/app/core/PopupApp'
import { initializeReduxStore } from 'src/store/store'
;(globalThis as any).regeneratorRuntime = undefined // eslint-disable-line @typescript-eslint/no-explicit-any

function makeFallbackPopup(): void {
  function initFallbackPopup() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
