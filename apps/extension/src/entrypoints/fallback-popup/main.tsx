// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference path="../../../../../index.d.ts" />
// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference path="../../../.wxt/wxt.d.ts" />

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PopupApp from 'src/app/core/PopupApp'
import { prefetchExtensionStatsigUserId } from 'src/app/core/StatsigProvider'
import { initializeReduxStore } from 'src/store/store'
// oxlint-disable-next-line typescript/no-explicit-any -- Global polyfill cleanup requires any type for runtime modification
;(globalThis as any).regeneratorRuntime = undefined

function makeFallbackPopup(): void {
  function initFallbackPopup() {
    // oxlint-disable-next-line typescript/no-non-null-assertion -- popup root element guaranteed to exist in extension
    const container = document.getElementById('fallback-popup-root')!
    const root = createRoot(container)

    root.render(
      <StrictMode>
        <PopupApp />
      </StrictMode>,
    )
  }

  prefetchExtensionStatsigUserId()
  initializeReduxStore({ readOnly: true })
  initFallbackPopup()
}

makeFallbackPopup()
