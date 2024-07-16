import '@tamagui/core/reset.css'
import 'src/app/Global.css'
import 'symbol-observable' // Needed by `reduxed-chrome-storage` as polyfill, order matters

import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import { RouteObject, RouterProvider } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { ExtensionStatsigProvider } from 'src/app/StatsigProvider'
import { GraphqlProvider } from 'src/app/apollo'
import { ErrorElement } from 'src/app/components/ErrorElement'
import { Complete } from 'src/app/features/onboarding/Complete'
import {
  CreateOnboardingSteps,
  ImportOnboardingSteps,
  OnboardingStepsProvider,
  ResetSteps,
  ScanOnboardingSteps,
} from 'src/app/features/onboarding/OnboardingSteps'
import { OnboardingWrapper } from 'src/app/features/onboarding/OnboardingWrapper'
import { PasswordImport } from 'src/app/features/onboarding/PasswordImport'
import { NameWallet } from 'src/app/features/onboarding/create/NameWallet'
import { PasswordCreate } from 'src/app/features/onboarding/create/PasswordCreate'
import { TestMnemonic } from 'src/app/features/onboarding/create/TestMnemonic'
import { ViewMnemonic } from 'src/app/features/onboarding/create/ViewMnemonic'
import { ImportMnemonic } from 'src/app/features/onboarding/import/ImportMnemonic'
import { SelectWallets } from 'src/app/features/onboarding/import/SelectWallets'
import { IntroScreen } from 'src/app/features/onboarding/intro/IntroScreen'
import { IntroScreenBetaWaitlist } from 'src/app/features/onboarding/intro/IntroScreenBetaWaitlist'
import { UnsupportedBrowserScreen } from 'src/app/features/onboarding/intro/UnsupportedBrowserScreen'
import { ResetComplete } from 'src/app/features/onboarding/reset/ResetComplete'
import { OTPInput } from 'src/app/features/onboarding/scan/OTPInput'
import { ScanToOnboard } from 'src/app/features/onboarding/scan/ScanToOnboard'
import { ScantasticContextProvider } from 'src/app/features/onboarding/scan/ScantasticContextProvider'
import { OnboardingRoutes, TopLevelRoutes } from 'src/app/navigation/constants'
import { navigate, setRouter, setRouterState } from 'src/app/navigation/state'
import { sentryCreateHashRouter } from 'src/app/sentry'
import { initExtensionAnalytics } from 'src/app/utils/analytics'
import { checksIfSupportsSidePanel } from 'src/app/utils/chrome'
import { PrimaryAppInstanceDebuggerLazy } from 'src/store/PrimaryAppInstanceDebuggerLazy'
import { getReduxPersistor, getReduxStore } from 'src/store/store'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UnitagUpdaterContextProvider } from 'uniswap/src/features/unitags/context'
import i18n from 'uniswap/src/i18n/i18n'
import { ExtensionOnboardingFlow } from 'uniswap/src/types/screens/extension'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'
import { LocalizationContextProvider } from 'wallet/src/features/language/LocalizationContext'
import { SharedProvider } from 'wallet/src/provider'

const supportsSidePanel = checksIfSupportsSidePanel()

const unsupportedRoute: RouteObject = {
  path: '',
  element: <UnsupportedBrowserScreen />,
}

const allRoutes = [
  {
    path: '',
    element: <IntroScreenBehindFeatureFlag />,
  },
  {
    path: OnboardingRoutes.UnsupportedBrowser,
    element: <UnsupportedBrowserScreen />,
  },
  {
    path: OnboardingRoutes.Create,
    element: (
      <MaybeRedirectToScantastic>
        <OnboardingStepsProvider
          key={OnboardingRoutes.Create}
          steps={{
            [CreateOnboardingSteps.Password]: <PasswordCreate />,
            [CreateOnboardingSteps.ViewMnemonic]: <ViewMnemonic />,
            [CreateOnboardingSteps.TestMnemonic]: <TestMnemonic />,
            [CreateOnboardingSteps.Naming]: <NameWallet />,
            [CreateOnboardingSteps.Complete]: <Complete flow={ExtensionOnboardingFlow.New} />,
          }}
        />
      </MaybeRedirectToScantastic>
    ),
  },
  {
    path: OnboardingRoutes.Import,
    element: (
      <MaybeRedirectToScantastic>
        <OnboardingStepsProvider
          key={OnboardingRoutes.Import}
          steps={{
            [ImportOnboardingSteps.Mnemonic]: <ImportMnemonic />,
            [ImportOnboardingSteps.Password]: <PasswordImport flow={ExtensionOnboardingFlow.Import} />,
            [ImportOnboardingSteps.Select]: <SelectWallets flow={ExtensionOnboardingFlow.Import} />,
            [ImportOnboardingSteps.Complete]: <Complete flow={ExtensionOnboardingFlow.Import} />,
          }}
        />
      </MaybeRedirectToScantastic>
    ),
  },
  {
    path: OnboardingRoutes.Scan,
    element: <ScantasticFlow key={OnboardingRoutes.Scan} />,
  },
  {
    path: OnboardingRoutes.ResetScan,
    element: <ScantasticFlow key={OnboardingRoutes.ResetScan} isResetting />,
  },
  {
    path: OnboardingRoutes.Reset,
    element: (
      <MaybeRedirectToScantastic>
        <OnboardingStepsProvider
          key={OnboardingRoutes.Reset}
          isResetting
          steps={{
            [ResetSteps.Mnemonic]: <ImportMnemonic />,
            [ResetSteps.Password]: <PasswordImport flow={ExtensionOnboardingFlow.Import} />,
            [ResetSteps.Select]: <SelectWallets flow={ExtensionOnboardingFlow.Import} />,
            [ResetSteps.Complete]: <ResetComplete />,
          }}
        />
      </MaybeRedirectToScantastic>
    ),
  },
]

const router = sentryCreateHashRouter([
  {
    path: `/${TopLevelRoutes.Onboarding}`,
    element: <OnboardingWrapper />,
    errorElement: <ErrorElement />,
    children: !supportsSidePanel ? [unsupportedRoute] : allRoutes,
  },
])

function ScantasticFlow({ isResetting = false }: { isResetting?: boolean }): JSX.Element {
  return (
    <OnboardingStepsProvider
      ContainerComponent={ScantasticContextProvider}
      isResetting={isResetting}
      steps={{
        [ScanOnboardingSteps.Scan]: <ScanToOnboard />,
        [ScanOnboardingSteps.OTP]: <OTPInput />,
        [ScanOnboardingSteps.Password]: <PasswordImport allowBack={false} flow={ExtensionOnboardingFlow.Scantastic} />,
        [ScanOnboardingSteps.Select]: <SelectWallets flow={ExtensionOnboardingFlow.Scantastic} />,
        [ScanOnboardingSteps.Complete]: isResetting ? (
          <ResetComplete />
        ) : (
          <Complete flow={ExtensionOnboardingFlow.Scantastic} />
        ),
      }}
    />
  )
}

function IntroScreenBehindFeatureFlag(): JSX.Element {
  const scantasticOnboardingOnly = useFeatureFlag(FeatureFlags.ScantasticOnboardingOnly)
  return scantasticOnboardingOnly ? <IntroScreenBetaWaitlist /> : <IntroScreen />
}

function MaybeRedirectToScantastic({ children }: { children: JSX.Element }): JSX.Element | null {
  const scantasticOnboardingOnly = useFeatureFlag(FeatureFlags.ScantasticOnboardingOnly)
  if (scantasticOnboardingOnly) {
    navigate(`/${TopLevelRoutes.Onboarding}`, { replace: true })
    return null
  }
  return children
}

/**
 * Note: we are using a pattern here to avoid circular dependencies, because
 * this is the root of the app and it imports all sub-pages, we need to push the
 * router/router state to a different file so it can be imported by those pages
 */
router.subscribe((state) => {
  setRouterState(state)
})

setRouter(router)

export default function OnboardingApp(): JSX.Element {
  // initialize analytics on load
  useEffect(() => {
    async function initAndLogLoad(): Promise<void> {
      await initExtensionAnalytics()
      sendAnalyticsEvent(ExtensionEventName.OnboardingLoad)
    }
    initAndLogLoad().catch(() => undefined)
  }, [])

  return (
    <Trace>
      <PersistGate persistor={getReduxPersistor()}>
        <ExtensionStatsigProvider>
          <I18nextProvider i18n={i18n}>
            <SharedProvider reduxStore={getReduxStore()}>
              <ErrorBoundary>
                <GraphqlProvider>
                  <LocalizationContextProvider>
                    <UnitagUpdaterContextProvider>
                      <PrimaryAppInstanceDebuggerLazy />
                      <RouterProvider router={router} />
                    </UnitagUpdaterContextProvider>
                  </LocalizationContextProvider>
                </GraphqlProvider>
              </ErrorBoundary>
            </SharedProvider>
          </I18nextProvider>
        </ExtensionStatsigProvider>
      </PersistGate>
    </Trace>
  )
}
