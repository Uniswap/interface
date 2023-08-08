import './App.css'

import { ToastProvider, ToastViewport } from '@tamagui/toast'
import { useEffect } from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { GraphqlProvider } from 'src/app/apollo'
import { ErrorBoundary } from 'src/app/components/ErrorBoundary'
import { BottomToast } from 'src/app/components/toast/BottomToast'
import Trace from 'src/app/components/Trace/Trace'
import { TraceUserProperties } from 'src/app/components/Trace/TraceUserProperties'
import { AccountSwitcherScreen } from 'src/app/features/accounts/AccountSwitcherScreen'
import { Complete } from 'src/app/features/onboarding/Complete'
import { NameWallet } from 'src/app/features/onboarding/create/NameWallet'
import { TestMnemonic } from 'src/app/features/onboarding/create/TestMnemonic'
import { ViewMnemonic } from 'src/app/features/onboarding/create/ViewMnemonic'
import { ImportMnemonic } from 'src/app/features/onboarding/import/ImportMnemonic'
import { SelectWallets } from 'src/app/features/onboarding/import/SelectWallets'
import { IntroScreen } from 'src/app/features/onboarding/IntroScreen'
import { OnboardingStepWrapper } from 'src/app/features/onboarding/OnboardingStepWrapper'
import { OnboardingWrapper } from 'src/app/features/onboarding/OnboardingWrapper'
import { Password } from 'src/app/features/onboarding/Password'
import { SettingsScreen } from 'src/app/features/settings/SettingsScreen'
import { SettingsScreenWrapper } from 'src/app/features/settings/SettingsScreenWrapper'
import { SettingsViewRecoveryPhraseScreen } from 'src/app/features/settings/SettingsViewRecoveryPhraseScreen'
import { SettingsWalletEditNicknameScreen } from 'src/app/features/settings/SettingsWalletEditNicknameScreen'
import { SettingsWalletScreen } from 'src/app/features/settings/SettingsWalletScreen'
import { sendExtensionAnalyticsEvent } from 'src/app/features/telemetry'
import { ExtensionEventName } from 'src/app/features/telemetry/constants'
import {
  AppRoutes,
  CreateOnboardingRoutes,
  createOnboardingSteps,
  ImportOnboardingRoutes,
  importOnboardingSteps,
  OnboardingRoutes,
  SettingsRoutes,
  SettingsWalletRoutes,
  TopLevelRoutes,
} from 'src/app/navigation/constants'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { SharedProvider } from 'wallet/src/provider'
import { Store } from 'webext-redux'
import { MainContent, WebNavigation } from './navigation'

const EXTENSION_ORIGIN_APPLICATION = 'extension'

const router = createHashRouter([
  {
    path: `/${TopLevelRoutes.Onboarding}`,
    element: <OnboardingWrapper />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: '',
        element: <IntroScreen />,
      },
      {
        path: OnboardingRoutes.Create,
        element: (
          <OnboardingStepWrapper
            methodRoute={OnboardingRoutes.Create}
            steps={createOnboardingSteps}
          />
        ),
        children: [
          {
            path: CreateOnboardingRoutes.Password,
            element: (
              <Password
                createAccountOnNext
                nextPath={`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Create}/${CreateOnboardingRoutes.ViewMnemonic}`}
              />
            ),
          },
          {
            path: CreateOnboardingRoutes.ViewMnemonic,
            element: <ViewMnemonic />,
          },
          {
            path: CreateOnboardingRoutes.TestMnemonic,
            element: <TestMnemonic />,
          },
          {
            path: CreateOnboardingRoutes.Naming,
            element: (
              <NameWallet
                previousPath={`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Create}/${CreateOnboardingRoutes.ViewMnemonic}`}
              />
            ),
          },
          {
            path: CreateOnboardingRoutes.Complete,
            element: <Complete />,
          },
        ],
      },
      {
        path: OnboardingRoutes.Import,
        element: (
          <OnboardingStepWrapper
            methodRoute={OnboardingRoutes.Import}
            steps={importOnboardingSteps}
          />
        ),
        children: [
          {
            path: ImportOnboardingRoutes.Password,
            element: (
              <Password
                nextPath={`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Import}/${ImportOnboardingRoutes.Mnemonic}`}
              />
            ),
          },
          {
            path: ImportOnboardingRoutes.Mnemonic,
            element: <ImportMnemonic />,
          },
          {
            path: ImportOnboardingRoutes.Select,
            element: <SelectWallets />,
          },
          {
            path: ImportOnboardingRoutes.Complete,
            element: <Complete />,
          },
        ],
      },
    ],
  },
  // TODO: flesh out notifications route
  {
    path: `/${TopLevelRoutes.Notifications}`,
    errorElement: <ErrorBoundary />,
    element: <div>Notifications</div>,
  },
  {
    path: '',
    element: <WebNavigation />,
    errorElement: <ErrorBoundary />,
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
  // initialize analytics on load
  useEffect(() => {
    async function initAndLogLoad(): Promise<void> {
      await analytics.init(
        new ApplicationTransport(uniswapUrls.amplitudeProxyUrl, EXTENSION_ORIGIN_APPLICATION)
      )
      sendExtensionAnalyticsEvent(ExtensionEventName.ExtensionLoad)
    }
    initAndLogLoad().catch(() => undefined)
  }, [])

  return (
    <Trace>
      <SharedProvider reduxStore={store}>
        <GraphqlProvider>
          <TraceUserProperties />
          <ToastProvider>
            <RouterProvider router={router} />
            <ToastViewport bottom={0} flexDirection="column" left={0} name="popup" right={0} />
            <ToastViewport left={0} name="onboarding" right={0} top={0} />
            <BottomToast />
          </ToastProvider>
        </GraphqlProvider>
      </SharedProvider>
    </Trace>
  )
}

export default App
