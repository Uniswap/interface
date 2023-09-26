// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../index.d.ts" />

import { lazy } from 'react'
import { createRoot } from 'react-dom/client'
;(globalThis as any).regeneratorRuntime = undefined // eslint-disable-line @typescript-eslint/no-explicit-any
// The globalThis.regeneratorRuntime = undefined addresses a potentially unsafe-eval problem
// see https://github.com/facebook/regenerator/issues/378#issuecomment-802628326

const App = lazy(() => import('src/app/OnboardingApp'))

const container = document.getElementById('onboarding-root')
if (container) {
  const root = createRoot(container)
  root.render(<App />)
}
