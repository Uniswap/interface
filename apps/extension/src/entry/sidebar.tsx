// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../index.d.ts" />

import 'src/app/utils/devtools'
import 'symbol-observable' // Needed by `reduxed-chrome-storage` as polyfill, order matters

import React from 'react'
import { createRoot } from 'react-dom/client'
import SidebarApp from 'src/app/core/SidebarApp'
import { onboardingMessageChannel } from 'src/background/messagePassing/messageChannels'
import { OnboardingMessageType } from 'src/background/messagePassing/types/ExtensionMessages'
import { initializeReduxStore } from 'src/store/store'
import { ExtensionAppLocation, StoreSynchronization } from 'src/store/storeSynchronization'
import { initializeScrollWatcher } from 'uniswap/src/components/modals/ScrollLock'
import { logger } from 'utilities/src/logger/logger'
;(globalThis as any).regeneratorRuntime = undefined // eslint-disable-line @typescript-eslint/no-explicit-any
// The globalThis.regeneratorRuntime = undefined addresses a potentially unsafe-eval problem
// see https://github.com/facebook/regenerator/issues/378#issuecomment-802628326

async function initSidebar(): Promise<void> {
  await initializeReduxStore()
  await onboardingMessageChannel.sendMessage({
    type: OnboardingMessageType.SidebarOpened,
  })

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const container = window.document.querySelector('#root')!
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <SidebarApp />
    </React.StrictMode>,
  )
}

StoreSynchronization.init(ExtensionAppLocation.SidePanel).catch((error) => {
  logger.error(error, {
    tags: {
      file: 'sidebar.ts',
      function: 'initPrimaryInstanceHandler',
    },
  })
})

initSidebar().catch((error) => {
  logger.error(error, {
    tags: {
      file: 'sidebar.ts',
      function: 'initSidebar',
    },
  })
})

initializeScrollWatcher()
