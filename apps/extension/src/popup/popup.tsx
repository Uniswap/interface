// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../index.d.ts" />

import { createRoot } from 'react-dom/client'
import { OptionalStrictMode } from 'src/app/components/OptionalStrictMode'
import PopupApp from 'src/app/PopupApp'
import { initializeSentry, SentryAppNameTag } from 'src/app/sentry'
import { getLocalUserId } from 'src/app/utils/storage'
import { initializeReduxStore } from 'src/store/store'
import { logger } from 'utilities/src/logger/logger'
;(globalThis as any).regeneratorRuntime = undefined // eslint-disable-line @typescript-eslint/no-explicit-any
// The globalThis.regeneratorRuntime = undefined addresses a potentially unsafe-eval problem
// see https://github.com/facebook/regenerator/issues/378#issuecomment-802628326

getLocalUserId()
  .then((userId) => {
    initializeSentry(SentryAppNameTag.Popup, userId)
  })
  .catch((error) => {
    logger.error(error, {
      tags: { file: 'popup.tsx', function: 'getLocalUserId' },
    })
  })
async function initPopup(): Promise<void> {
  await initializeReduxStore({ readOnly: true })

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const container = document.getElementById('popup-root')!
  const root = createRoot(container)

  root.render(
    <OptionalStrictMode>
      <PopupApp />
    </OptionalStrictMode>,
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
