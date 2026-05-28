// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../index.d.ts" />

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import UnitagClaimApp from 'src/app/core/UnitagClaimApp'
import { initializeReduxStore } from 'src/store/store'
;(globalThis as any).regeneratorRuntime = undefined // eslint-disable-line @typescript-eslint/no-explicit-any
// The globalThis.regeneratorRuntime = undefined addresses a potentially unsafe-eval problem
// see https://github.com/facebook/regenerator/issues/378#issuecomment-802628326

function initUnitagClaim(): void {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
