import '@tamagui/core/reset.css'
import 'src/app/Global.css'
import 'symbol-observable' // Needed by `reduxed-chrome-storage` as polyfill, order matters

import { useEffect } from 'react'
import { RouteObject, RouterProvider, createHashRouter } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { ErrorElement } from 'src/app/components/ErrorElement'
import { BaseAppContainer } from 'src/app/core/BaseAppContainer'
import { DatadogAppNameTag } from 'src/app/datadog'
import { ClaimUnitagScreen } from 'src/app/features/onboarding/ClaimUnitagScreen'
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
import { UnsupportedBrowserScreen } from 'src/app/features/onboarding/intro/UnsupportedBrowserScreen'
import { ResetComplete } from 'src/app/features/onboarding/reset/ResetComplete'
import { OTPInput } from 'src/app/features/onboarding/scan/OTPInput'
import { ScanToOnboard } from 'src/app/features/onboarding/scan/ScanToOnboard'
import { ScantasticContextProvider } from 'src/app/features/onboarding/scan/ScantasticContextProvider'
import { OnboardingRoutes, TopLevelRoutes } from 'src/app/navigation/constants'
import { setRouter, setRouterState } from 'src/app/navigation/state'
import { initExtensionAnalytics } from 'src/app/utils/analytics'
import { checksIfSupportsSidePanel } from 'src/app/utils/chrome'
import { PrimaryAppInstanceDebuggerLazy } from 'src/store/PrimaryAppInstanceDebuggerLazy'
import { getReduxPersistor } from 'src/store/store'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UnitagUpdaterContextProvider } from 'uniswap/src/features/unitags/context'
import { ExtensionOnboardingFlow } from 'uniswap/src/types/screens/extension'

const supportsSidePanel = checksIfSupportsSidePanel()

const unsupportedRoute: RouteObject = {
  path: '',
  element: <UnsupportedBrowserScreen />,
}

const allRoutes = [
  {
    path: '',
    element: <IntroScreen />,
  },
  {
    path: OnboardingRoutes.UnsupportedBrowser,
    element: <UnsupportedBrowserScreen />,
  },
  {
    path: OnboardingRoutes.Create,
    element: (
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
    ),
  },
  {
    path: OnboardingRoutes.Claim,
    element: (
      <OnboardingStepsProvider
        key={OnboardingRoutes.Claim}
        steps={{
          [CreateOnboardingSteps.ClaimUnitag]: <ClaimUnitagScreen />,
          [CreateOnboardingSteps.Password]: <PasswordCreate />,
          [CreateOnboardingSteps.ViewMnemonic]: <ViewMnemonic />,
          [CreateOnboardingSteps.TestMnemonic]: <TestMnemonic />,
          [CreateOnboardingSteps.Complete]: <Complete tryToClaimUnitag flow={ExtensionOnboardingFlow.New} />,
        }}
      />
    ),
  },
  {
    path: OnboardingRoutes.Import,
    element: (
      <OnboardingStepsProvider
        key={OnboardingRoutes.Import}
        steps={{
          [ImportOnboardingSteps.Mnemonic]: <ImportMnemonic />,
          [ImportOnboardingSteps.Password]: <PasswordImport flow={ExtensionOnboardingFlow.Import} />,
          [ImportOnboardingSteps.Select]: <SelectWallets flow={ExtensionOnboardingFlow.Import} />,
          [ImportOnboardingSteps.Complete]: <Complete flow={ExtensionOnboardingFlow.Import} />,
        }}
      />
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
    ),
  },
]

const router = createHashRouter([
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
    <PersistGate persistor={getReduxPersistor()}>
      <BaseAppContainer appName={DatadogAppNameTag.Onboarding}>
        <UnitagUpdaterContextProvider>
          <PrimaryAppInstanceDebuggerLazy />
          <RouterProvider router={router} />
        </UnitagUpdaterContextProvider>
      </BaseAppContainer>
    </PersistGate>
  )
}
