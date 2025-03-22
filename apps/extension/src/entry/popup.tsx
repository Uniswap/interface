// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../index.d.ts" />

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PopupApp from 'src/app/core/PopupApp'
import { initializeReduxStore } from 'src/store/store'
import { logger } from 'utilities/src/logger/logger'
;(globalThis as any).regeneratorRuntime = undefined // eslint-disable-line @typescript-eslint/no-explicit-any
// The globalThis.regeneratorRuntime = undefined addresses a potentially unsafe-eval problem
// see https://github.com/facebook/regenerator/issues/378#issuecomment-802628326

async function initPopup(): Promise<void> {
  await initializeReduxStore({ readOnly: true })

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const container = document.getElementById('popup-root')!
  const root = createRoot(container)

  root.render(
    <StrictMode>
      <PopupApp />
    </StrictMode>,
  )
}

initPopup().catch((error) => {
  logger.error(error, {
    tags: {
      file: 'popup.tsx',
      function: 'initPopup',
    },
  })
})
