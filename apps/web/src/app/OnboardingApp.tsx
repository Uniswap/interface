import 'src/app/Global.css'

import { ToastProvider, ToastViewport } from '@tamagui/toast'
import { useEffect } from 'react'
import { createHashRouter, Outlet, RouterProvider } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { GraphqlProvider } from 'src/app/apollo'
import { ErrorBoundary } from 'src/app/components/ErrorBoundary'
import Trace from 'src/app/components/Trace/Trace'
import { Complete } from 'src/app/features/onboarding/Complete'
import { NameWallet } from 'src/app/features/onboarding/create/NameWallet'
import { TestMnemonic } from 'src/app/features/onboarding/create/TestMnemonic'
import { ViewMnemonic } from 'src/app/features/onboarding/create/ViewMnemonic'
import { ImportMnemonic } from 'src/app/features/onboarding/import/ImportMnemonic'
import { SelectWallets } from 'src/app/features/onboarding/import/SelectWallets'
import { IntroScreen } from 'src/app/features/onboarding/IntroScreen'
import { OnboardingWrapper } from 'src/app/features/onboarding/OnboardingWrapper'
import { Password } from 'src/app/features/onboarding/Password'
import { sendExtensionAnalyticsEvent } from 'src/app/features/telemetry'
import { ExtensionEventName } from 'src/app/features/telemetry/constants'
import {
  CreateOnboardingRoutes,
  ImportOnboardingRoutes,
  OnboardingRoutes,
  TopLevelRoutes,
} from 'src/app/navigation/constants'
import { persistor, store } from 'src/onboarding/onboardingStore'
import { Flex } from 'ui/src'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { ApplicationTransport } from 'utilities/src/telemetry/analytics/ApplicationTransport'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { LocalizationContextProvider } from 'wallet/src/features/language/LocalizationContext'
import { SharedProvider } from 'wallet/src/provider'

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
          <Flex centered grow width="100%">
            <Outlet />
          </Flex>
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
          <Flex centered grow width="100%">
            <Outlet />
          </Flex>
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
])

function OnboardingApp(): JSX.Element {
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
      <PersistGate persistor={persistor}>
        <SharedProvider reduxStore={store}>
          <GraphqlProvider>
            <LocalizationContextProvider>
              <ToastProvider>
                <RouterProvider router={router} />
                <ToastViewport left={0} name="onboarding" right={0} top={0} />
              </ToastProvider>
            </LocalizationContextProvider>
          </GraphqlProvider>
        </SharedProvider>
      </PersistGate>
    </Trace>
  )
}

export default OnboardingApp
