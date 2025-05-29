// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../index.d.ts" />

import React from 'react'
import { createRoot } from 'react-dom/client'
import OnboardingApp from 'src/app/core/OnboardingApp'
import { ExtensionAppLocation, StoreSynchronization } from 'src/store/storeSynchronization'
;(globalThis as any).regeneratorRuntime = undefined // eslint-disable-line @typescript-eslint/no-explicit-any
// The globalThis.regeneratorRuntime = undefined addresses a potentially unsafe-eval problem
// see https://github.com/facebook/regenerator/issues/378#issuecomment-802628326

function initOnboarding() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
