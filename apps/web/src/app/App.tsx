import './App.css'

import { ToastProvider, ToastViewport } from '@tamagui/toast'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { GraphqlProvider } from 'src/app/apollo'
import { BottomToast } from 'src/app/components/toast/BottomToast'
import { AccountSwitcherScreen } from 'src/app/features/accounts/AccountSwitcherScreen'
import { Complete } from 'src/app/features/onboarding/Complete'
import { ImportMnemonic } from 'src/app/features/onboarding/ImportMnemonic'
import { IntroScreen } from 'src/app/features/onboarding/IntroScreen'
import { OnboardingWrapper } from 'src/app/features/onboarding/OnboardingWrapper'
import { Password } from 'src/app/features/onboarding/Password'
import { SettingsScreen } from 'src/app/features/settings/SettingsScreen'
import { SettingsScreenWrapper } from 'src/app/features/settings/SettingsScreenWrapper'
import { SettingsViewRecoveryPhraseScreen } from 'src/app/features/settings/SettingsViewRecoveryPhraseScreen'
import { SettingsWalletEditNicknameScreen } from 'src/app/features/settings/SettingsWalletEditNicknameScreen'
import { SettingsWalletScreen } from 'src/app/features/settings/SettingsWalletScreen'
import {
  AppRoutes,
  OnboardingRoutes,
  SettingsRoutes,
  SettingsWalletRoutes,
  TopLevelRoutes,
} from 'src/app/navigation/constants'
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
        path: AppRoutes.AccountSwitcher,
        element: <AccountSwitcherScreen />,
      },
      {
        path: AppRoutes.Settings,
        element: <SettingsScreenWrapper />,
        children: [
          {
            path: '',
            element: <SettingsScreen />,
          },
          {
            path: `${SettingsRoutes.Wallet}/:address`,
            element: <SettingsWalletScreen />,
          },
          {
            path: `${SettingsRoutes.Wallet}/:address/${SettingsWalletRoutes.EditNickname}`,
            element: <SettingsWalletEditNicknameScreen />,
          },
          {
            path: SettingsRoutes.ViewRecoveryPhrase,
            element: <SettingsViewRecoveryPhraseScreen />,
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
        <ToastProvider>
          <RouterProvider router={router} />
          <ToastViewport bottom={0} flexDirection="column" left={0} right={0} />
          <BottomToast />
        </ToastProvider>
      </GraphqlProvider>
    </Provider>
  )
}

export default App
