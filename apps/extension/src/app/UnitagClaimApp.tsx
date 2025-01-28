import '@tamagui/core/reset.css'
import 'src/app/Global.css'

import { PropsWithChildren, useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import { Outlet, RouterProvider, createHashRouter, useSearchParams } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { ExtensionStatsigProvider } from 'src/app/StatsigProvider'
import { GraphqlProvider } from 'src/app/apollo'
import { ErrorElement } from 'src/app/components/ErrorElement'
import { TraceUserProperties } from 'src/app/components/Trace/TraceUserProperties'
import { DatadogAppNameTag } from 'src/app/datadog'
import {
  ClaimUnitagSteps,
  OnboardingStepsProvider,
  useOnboardingSteps,
} from 'src/app/features/onboarding/OnboardingSteps'
import { EditUnitagProfileScreen } from 'src/app/features/unitags/EditUnitagProfileScreen'
import { UnitagChooseProfilePicScreen } from 'src/app/features/unitags/UnitagChooseProfilePicScreen'
import { UnitagClaimBackground } from 'src/app/features/unitags/UnitagClaimBackground'
import { UnitagClaimContextProvider } from 'src/app/features/unitags/UnitagClaimContext'
import { UnitagConfirmationScreen } from 'src/app/features/unitags/UnitagConfirmationScreen'
import { UnitagCreateUsernameScreen } from 'src/app/features/unitags/UnitagCreateUsernameScreen'
import { UnitagIntroScreen } from 'src/app/features/unitags/UnitagIntroScreen'
import { UnitagClaimRoutes } from 'src/app/navigation/constants'
import { setRouter, setRouterState } from 'src/app/navigation/state'
import { initExtensionAnalytics } from 'src/app/utils/analytics'
import { getReduxPersistor, getReduxStore } from 'src/store/store'
import { Flex } from 'ui/src'
import { BlankUrlProvider } from 'uniswap/src/contexts/UrlContext'
import { LocalizationContextProvider } from 'uniswap/src/features/language/LocalizationContext'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { UnitagUpdaterContextProvider } from 'uniswap/src/features/unitags/context'
import i18n from 'uniswap/src/i18n'
import { logger } from 'utilities/src/logger/logger'
import { usePrevious } from 'utilities/src/react/hooks'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'
import { useTestnetModeForLoggingAndAnalytics } from 'wallet/src/features/testnetMode/hooks'
import { useAccountAddressFromUrlWithThrow } from 'wallet/src/features/wallet/hooks'
import { SharedWalletProvider } from 'wallet/src/providers/SharedWalletProvider'

const router = createHashRouter([
  {
    path: '',
    element: <UnitagAppInner />,
    children: [
      {
        path: UnitagClaimRoutes.ClaimIntro,
        element: <UnitagClaimFlow />,
        errorElement: <ErrorElement />,
      },
      {
        path: UnitagClaimRoutes.EditProfile,
        element: <UnitagEditProfileFlow />,
        errorElement: <ErrorElement />,
      },
    ],
  },
])

/**
 * Note: we are using a pattern here to avoid circular dependencies, because
 * this is the root of the app and it imports all sub-pages, we need to push the
 * router/router state to a different file so it can be imported by those pages
 */
router.subscribe((state) => {
  setRouterState(state)
})

setRouter(router)

function UnitagAppInner(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams()

  const address = useAccountAddressFromUrlWithThrow()
  const prevAddress = usePrevious(address)

  // Ensures that address in url search params is consistent with hook
  useEffect(() => {
    if (searchParams.get('address') !== address) {
      setSearchParams({ address })
    }
  }, [searchParams, address, setSearchParams])

  useEffect(() => {
    if (prevAddress && address !== prevAddress) {
      // needed to reload on address param change for hash router
      router
        .navigate(0)
        .catch((e) => logger.error(e, { tags: { file: 'UnitagClaimApp.tsx', function: 'UnitagClaimAppInner' } }))
    }
  }, [address, prevAddress])

  useTestnetModeForLoggingAndAnalytics()

  return <Outlet />
}

function UnitagClaimFlow(): JSX.Element {
  return (
    <Flex centered height="100%" width="100%">
      <OnboardingStepsProvider
        disableRedirect
        steps={{
          [ClaimUnitagSteps.Intro]: <UnitagIntroScreen />,
          [ClaimUnitagSteps.CreateUsername]: <UnitagCreateUsernameScreen />,
          [ClaimUnitagSteps.ChooseProfilePic]: <UnitagChooseProfilePicScreen />,
          [ClaimUnitagSteps.Confirmation]: <UnitagConfirmationScreen />,
          [ClaimUnitagSteps.EditProfile]: <EditUnitagProfileScreen enableBack />,
        }}
        ContainerComponent={UnitagClaimAppWrapper}
      />
      <Outlet />
    </Flex>
  )
}

function UnitagClaimAppWrapper({ children }: PropsWithChildren): JSX.Element {
  const { step } = useOnboardingSteps()
  const blurAllBackground = step !== ClaimUnitagSteps.Intro

  return (
    <UnitagClaimContextProvider>
      <UnitagClaimBackground blurAll={blurAllBackground}>{children}</UnitagClaimBackground>
    </UnitagClaimContextProvider>
  )
}

function UnitagEditProfileFlow(): JSX.Element {
  return (
    <Flex centered height="100%" width="100%">
      <OnboardingStepsProvider
        disableRedirect
        steps={{
          [ClaimUnitagSteps.EditProfile]: <EditUnitagProfileScreen />,
        }}
        ContainerComponent={UnitagClaimAppWrapper}
      />
      <Outlet />
    </Flex>
  )
}

// TODO WALL-4876 combine this with `PopupApp`
export default function UnitagClaimApp(): JSX.Element {
  // initialize analytics on load
  useEffect(() => {
    initExtensionAnalytics().catch(() => undefined)
  }, [])

  return (
    <Trace>
      <PersistGate persistor={getReduxPersistor()}>
        <ExtensionStatsigProvider appName={DatadogAppNameTag.UnitagClaim}>
          <I18nextProvider i18n={i18n}>
            <SharedWalletProvider reduxStore={getReduxStore()}>
              <ErrorBoundary>
                <GraphqlProvider>
                  <BlankUrlProvider>
                    <LocalizationContextProvider>
                      <UnitagUpdaterContextProvider>
                        <TraceUserProperties />
                        <RouterProvider router={router} />
                      </UnitagUpdaterContextProvider>
                    </LocalizationContextProvider>
                  </BlankUrlProvider>
                </GraphqlProvider>
              </ErrorBoundary>
            </SharedWalletProvider>
          </I18nextProvider>
        </ExtensionStatsigProvider>
      </PersistGate>
    </Trace>
  )
}
