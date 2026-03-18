// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../../index.d.ts" />
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../.wxt/wxt.d.ts" />

import React from 'react'
import { createRoot } from 'react-dom/client'
import OnboardingApp from 'src/app/core/OnboardingApp'
import { ExtensionAppLocation, StoreSynchronization } from 'src/store/storeSynchronization'
// biome-ignore lint/suspicious/noExplicitAny: Global polyfill cleanup requires any type for runtime modification
;(globalThis as any).regeneratorRuntime = undefined

function makeOnboarding(): void {
  function initOnboarding() {
    // biome-ignore lint/style/noNonNullAssertion: DOM onboarding root element guaranteed to exist in extension
    const container = document.getElementById('onboarding-root')!
    const root = createRoot(container)

    root.render(
      <React.StrictMode>
        <OnboardingApp />
      </React.StrictMode>,
    )
  }

  StoreSynchronization.init(ExtensionAppLocation.Tab)
  initOnboarding()
}

makeOnboarding()
