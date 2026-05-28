// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference path="../../../../../index.d.ts" />
// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference path="../../../.wxt/wxt.d.ts" />

import React from 'react'
import { createRoot } from 'react-dom/client'
import OnboardingApp from 'src/app/core/OnboardingApp'
import { prefetchExtensionStatsigUserId } from 'src/app/core/StatsigProvider'
import { ExtensionAppLocation, StoreSynchronization } from 'src/store/storeSynchronization'
// oxlint-disable-next-line typescript/no-explicit-any -- Global polyfill cleanup requires any type for runtime modification
;(globalThis as any).regeneratorRuntime = undefined

function makeOnboarding(): void {
  function initOnboarding() {
    // oxlint-disable-next-line typescript/no-non-null-assertion -- DOM onboarding root element guaranteed to exist in extension
    const container = document.getElementById('onboarding-root')!
    const root = createRoot(container)

    root.render(
      <React.StrictMode>
        <OnboardingApp />
      </React.StrictMode>,
    )
  }

  prefetchExtensionStatsigUserId()
  StoreSynchronization.init(ExtensionAppLocation.Tab)
  initOnboarding()
}

makeOnboarding()
