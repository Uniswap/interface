// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../../index.d.ts" />
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../.wxt/wxt.d.ts" />

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import UnitagClaimApp from 'src/app/core/UnitagClaimApp'
import { initializeReduxStore } from 'src/store/store'
// biome-ignore lint/suspicious/noExplicitAny: Global polyfill cleanup requires any type for runtime modification
;(globalThis as any).regeneratorRuntime = undefined

function makeUnitagClaim(): void {
  function initUnitagClaim(): void {
    // biome-ignore lint/style/noNonNullAssertion: DOM unitag claim root element guaranteed to exist in extension
    const container = document.getElementById('unitag-claim-root')!
    const root = createRoot(container)

    root.render(
      <StrictMode>
        <UnitagClaimApp />
      </StrictMode>,
    )
  }

  initializeReduxStore({ readOnly: true })
  initUnitagClaim()
}

makeUnitagClaim()
