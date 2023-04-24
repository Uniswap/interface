import './App.css'

import { createHashRouter, RouterProvider } from 'react-router-dom'
import { ImportMnemonic } from 'wallet/src/features/onboarding/ImportMnemonic'
import { IntroScreen } from 'wallet/src/features/onboarding/IntroScreen'
import { OnboardingWrapper } from 'wallet/src/features/onboarding/OnboardingWrapper'
import { WebNavigation } from 'wallet/src/navigation'
import { Provider } from 'wallet/src/provider'
import { Store } from 'webext-redux'

// TODO(xtine): make route names constants
const router = createHashRouter([
  {
    path: '/onboarding',
    element: <OnboardingWrapper />,
    children: [
      {
        path: 'import',
        element: <ImportMnemonic />,
      },
      {
        path: '',
        element: <IntroScreen />,
      },
    ],
  },
  {
    path: '',
    element: <WebNavigation />,
  },
])

function App({ store }: { store: Store }): JSX.Element {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  )
}

export default App
