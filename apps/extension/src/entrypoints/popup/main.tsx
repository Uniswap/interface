// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../../index.d.ts" />

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PopupApp from 'src/app/core/PopupApp'
import { initializeReduxStore } from 'src/store/store'
;(globalThis as any).regeneratorRuntime = undefined // eslint-disable-line @typescript-eslint/no-explicit-any

function makePopup(): void {
  function initPopup() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const container = document.getElementById('popup-root')!
    const root = createRoot(container)

    root.render(
      <StrictMode>
        <PopupApp />
      </StrictMode>,
    )
  }

  initializeReduxStore({ readOnly: true })
  initPopup()
}

makePopup()
