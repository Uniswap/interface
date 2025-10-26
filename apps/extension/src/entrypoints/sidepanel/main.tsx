// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../../index.d.ts" />
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../.wxt/wxt.d.ts" />

import 'src/app/utils/devtools'
import 'symbol-observable' // Needed by `reduxed-chrome-storage` as polyfill, order matters

import React from 'react'
import { createRoot } from 'react-dom/client'
import SidebarApp from 'src/app/core/SidebarApp'
import { onboardingMessageChannel } from 'src/background/messagePassing/messageChannels'
import { OnboardingMessageType } from 'src/background/messagePassing/types/ExtensionMessages'
import { ExtensionAppLocation, StoreSynchronization } from 'src/store/storeSynchronization'
import { initializeScrollWatcher } from 'uniswap/src/components/modals/ScrollLock'
import { logger } from 'utilities/src/logger/logger'
// biome-ignore lint/suspicious/noExplicitAny: Global polyfill cleanup requires any type for runtime modification
;(globalThis as any).regeneratorRuntime = undefined

export function makeSidebar(): void {
  function initSidebar(): void {
    onboardingMessageChannel
      .sendMessage({
        type: OnboardingMessageType.SidebarOpened,
      })
      .catch((error) => {
        logger.error(error, {
          tags: {
            file: 'sidebar.ts',
            function: 'onboardingMessageChannel.sendMessage',
          },
        })
      })

    // biome-ignore lint/style/noNonNullAssertion: DOM root element guaranteed to exist in extension context
    const container = window.document.querySelector('#root')!
    const root = createRoot(container)

    root.render(
      <React.StrictMode>
        <SidebarApp />
      </React.StrictMode>,
    )
  }

  StoreSynchronization.init(ExtensionAppLocation.SidePanel)
  initSidebar()
  initializeScrollWatcher()
}

makeSidebar()
