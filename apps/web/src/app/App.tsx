import './App.css'

import { createHashRouter, RouterProvider } from 'react-router-dom'
import { GraphqlProvider } from 'src/app/apollo'
import { Complete } from 'src/app/features/onboarding/Complete'
import { ImportMnemonic } from 'src/app/features/onboarding/ImportMnemonic'
import { IntroScreen } from 'src/app/features/onboarding/IntroScreen'
import { OnboardingWrapper } from 'src/app/features/onboarding/OnboardingWrapper'
import { Password } from 'src/app/features/onboarding/Password'
import { SettingsScreen } from 'src/app/features/settings/SettingsScreen'
import { SettingsWalletEditNicknameScreen } from 'src/app/features/settings/SettingsWalletEditNicknameScreen'
import { SettingsWalletScreen } from 'src/app/features/settings/SettingsWalletScreen'
import {
  AppRoutes,
  OnboardingRoutes,
  SettingsRoutes,
  SettingsWalletRoutes,
  TopLevelRoutes,
} from 'src/app/navigation/constants'
import { Flex } from 'ui/src/components/layout/Flex'
import { Provider } from 'wallet/src/provider'
import { Store } from 'webext-redux'
import { MainContent, WebNavigation } from './navigation'

const router = createHashRouter([
  {
    path: `/${TopLevelRoutes.Onboarding}`,
    element: <OnboardingWrapper />,
    children: [
      {
        path: OnboardingRoutes.Import,
        element: <ImportMnemonic />,
      },
      {
        path: OnboardingRoutes.Password,
        element: <Password />,
      },
      {
        path: OnboardingRoutes.Complete,
        element: <Complete />,
      },
      {
        path: '',
        element: <IntroScreen />,
      },
    ],
  },
  // TODO: flesh out notifications route
  {
    path: `/${TopLevelRoutes.Notifications}`,
    element: <div>Notifications</div>,
  },
  {
    path: '',
    element: <WebNavigation />,
    children: [
      {
        path: '',
        element: <MainContent />,
      },
      {
        path: AppRoutes.Settings,
        element: <SettingsScreen />,
        children: [
          {
            path: SettingsRoutes.Wallet,
            element: <SettingsWalletScreen />,
          },
          {
            path: `${SettingsRoutes.Wallet}/${SettingsWalletRoutes.EditNickname}`,
            element: <SettingsWalletEditNicknameScreen />,
          },
          {
            path: SettingsRoutes.ViewRecoveryPhrase,
            element: <Flex />, // TODO: Add ViewRecoveryPhrase screen
          },
        ],
      },
    ],
  },
])

function App({ store }: { store: Store }): JSX.Element {
  return (
    <Provider store={store}>
      <GraphqlProvider>
        <RouterProvider router={router} />
      </GraphqlProvider>
    </Provider>
  )
}

export default App
