import './App.css'


import { ImportMnemonic } from 'app/src/features/onboarding/ImportMnemonic'
import { IntroScreen } from 'app/src/features/onboarding/IntroScreen'
import { OnboardingWrapper } from 'app/src/features/onboarding/OnboardingWrapper'
import { WebNavigation } from 'app/src/navigation'
import { Provider } from 'app/src/provider'
import { createHashRouter, RouterProvider } from 'react-router-dom'
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
