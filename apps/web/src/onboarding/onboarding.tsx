// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../index.d.ts" />

import { createRoot } from 'react-dom/client'
import App from 'src/app/OnboardingApp'

const container = document.getElementById('onboarding-root')
const root = createRoot(container!)
root.render(<App />)
