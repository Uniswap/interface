import '@tamagui/core/reset.css'
import 'src/app/Global.css'
import 'symbol-observable' // Needed by `reduxed-chrome-storage` as polyfill, order matters

import { useEffect } from 'react'
import { createHashRouter, RouteObject, RouterProvider } from 'react-router'
import { PersistGate } from 'redux-persist/integration/react'
import { ErrorElement } from 'src/app/components/ErrorElement'
import { BaseAppContainer } from 'src/app/core/BaseAppContainer'
import { DatadogAppNameTag } from 'src/app/datadog'
import { ClaimUnitagScreen } from 'src/app/features/onboarding/ClaimUnitagScreen'
import { Complete } from 'src/app/features/onboarding/Complete'
import { PasswordCreate } from 'src/app/features/onboarding/create/PasswordCreate'
import { ImportMnemonic } from 'src/app/features/onboarding/import/ImportMnemonic'
import { InitiatePasskeyAuth } from 'src/app/features/onboarding/import/InitiatePasskeyAuth'
import { PasskeyImport } from 'src/app/features/onboarding/import/PasskeyImport'
import { PasskeyImportContextProvider } from 'src/app/features/onboarding/import/PasskeyImportContextProvider'
import { SelectImportMethod } from 'src/app/features/onboarding/import/SelectImportMethod'
import { SelectWallets } from 'src/app/features/onboarding/import/SelectWallets'
import { IntroScreen } from 'src/app/features/onboarding/intro/IntroScreen'
import { UnsupportedBrowserScreen } from 'src/app/features/onboarding/intro/UnsupportedBrowserScreen'
import {
  CreateOnboardingSteps,
  ImportOnboardingSteps,
  ImportPasskeySteps,
  OnboardingStepsProvider,
  ResetSteps,
  ScanOnboardingSteps,
  SelectImportMethodSteps,
} from 'src/app/features/onboarding/OnboardingSteps'
import { OnboardingWrapper } from 'src/app/features/onboarding/OnboardingWrapper'
import { PasswordImport } from 'src/app/features/onboarding/PasswordImport'
import { ResetComplete } from 'src/app/features/onboarding/reset/ResetComplete'
import { OTPInput } from 'src/app/features/onboarding/scan/OTPInput'
import { ScanToOnboard } from 'src/app/features/onboarding/scan/ScanToOnboard'
import { ScantasticContextProvider } from 'src/app/features/onboarding/scan/ScantasticContextProvider'
import { OnboardingRoutes, TopLevelRoutes } from 'src/app/navigation/constants'
import { OnboardingNavigationProvider } from 'src/app/navigation/providers'
import { setRouter, setRouterState } from 'src/app/navigation/state'
import { initExtensionAnalytics } from 'src/app/utils/analytics'
import { checksIfSupportsSidePanel } from 'src/app/utils/chrome'
import { PrimaryAppInstanceDebuggerLazy } from 'src/store/PrimaryAppInstanceDebuggerLazy'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ExtensionOnboardingFlow } from 'uniswap/src/types/screens/extension'
import { WalletUniswapProvider } from 'wallet/src/features/transactions/contexts/WalletUniswapContext'
import { getReduxPersistor } from 'wallet/src/state/persistor'

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
          [CreateOnboardingSteps.ClaimUnitag]: <ClaimUnitagScreen />,
          [CreateOnboardingSteps.Password]: <PasswordCreate />,
          [CreateOnboardingSteps.Complete]: <Complete tryToClaimUnitag flow={ExtensionOnboardingFlow.New} />,
        }}
      />
    ),
  },
  {
    path: OnboardingRoutes.SelectImportMethod,
    element: (
      <OnboardingStepsProvider
        key={OnboardingRoutes.SelectImportMethod}
        steps={{
          [SelectImportMethodSteps.SelectMethod]: <SelectImportMethod />,
        }}
      />
    ),
  },
  {
    path: OnboardingRoutes.ImportPasskey,
    element: (
      <OnboardingStepsProvider
        ContainerComponent={PasskeyImportContextProvider}
        key={OnboardingRoutes.ImportPasskey}
        steps={{
          [ImportPasskeySteps.InitiatePasskeyAuth]: <InitiatePasskeyAuth />,
          [ImportPasskeySteps.PasskeyImport]: <PasskeyImport />,
          [ImportOnboardingSteps.Password]: <PasswordImport flow={ExtensionOnboardingFlow.Passkey} />,
          [ImportOnboardingSteps.Select]: <SelectWallets flow={ExtensionOnboardingFlow.Passkey} />,
          [ImportOnboardingSteps.Complete]: <Complete flow={ExtensionOnboardingFlow.Passkey} />,
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
        <OnboardingNavigationProvider>
          <WalletUniswapProvider>
            <PrimaryAppInstanceDebuggerLazy />
            <RouterProvider router={router} />
          </WalletUniswapProvider>
        </OnboardingNavigationProvider>
      </BaseAppContainer>
    </PersistGate>
  )
}
