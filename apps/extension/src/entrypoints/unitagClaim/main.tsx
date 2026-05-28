// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference path="../../../../../index.d.ts" />
// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference path="../../../.wxt/wxt.d.ts" />

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { prefetchExtensionStatsigUserId } from 'src/app/core/StatsigProvider'
import UnitagClaimApp from 'src/app/core/UnitagClaimApp'
import { initializeReduxStore } from 'src/store/store'
// oxlint-disable-next-line typescript/no-explicit-any -- Global polyfill cleanup requires any type for runtime modification
;(globalThis as any).regeneratorRuntime = undefined

function makeUnitagClaim(): void {
  function initUnitagClaim(): void {
    // oxlint-disable-next-line typescript/no-non-null-assertion -- DOM unitag claim root element guaranteed to exist in extension
    const container = document.getElementById('unitag-claim-root')!
    const root = createRoot(container)

    root.render(
      <StrictMode>
        <UnitagClaimApp />
      </StrictMode>,
    )
  }

  prefetchExtensionStatsigUserId()
  initializeReduxStore({ readOnly: true })
  initUnitagClaim()
}

makeUnitagClaim()
