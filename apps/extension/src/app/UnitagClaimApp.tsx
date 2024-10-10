import '@tamagui/core/reset.css'
import 'src/app/Global.css'

import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import { Outlet, RouterProvider } from 'react-router-dom'
import { PersistGate } from 'redux-persist/integration/react'
import { ExtensionStatsigProvider } from 'src/app/StatsigProvider'
import { GraphqlProvider } from 'src/app/apollo'
import { ErrorElement } from 'src/app/components/ErrorElement'
import { TraceUserProperties } from 'src/app/components/Trace/TraceUserProperties'
import { ClaimUnitagSteps, OnboardingStepsProvider } from 'src/app/features/onboarding/OnboardingSteps'
import { UnitagChooseProfilePicScreen } from 'src/app/features/unitags/UnitagChooseProfilePicScreen'
import { UnitagClaimContextProvider } from 'src/app/features/unitags/UnitagClaimContext'
import { UnitagCreateUsernameScreen } from 'src/app/features/unitags/UnitagCreateUsernameScreen'
import { UnitagIntroScreen } from 'src/app/features/unitags/UnitagIntroScreen'
import { setRouter, setRouterState } from 'src/app/navigation/state'
import { SentryAppNameTag, initializeSentry, sentryCreateHashRouter } from 'src/app/sentry'
import { initExtensionAnalytics } from 'src/app/utils/analytics'
import { getLocalUserId } from 'src/app/utils/storage'
import { getReduxPersistor, getReduxStore } from 'src/store/store'
import { Flex } from 'ui/src'
import { LocalizationContextProvider } from 'uniswap/src/features/language/LocalizationContext'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { UnitagUpdaterContextProvider } from 'uniswap/src/features/unitags/context'
import i18n from 'uniswap/src/i18n/i18n'
import { logger } from 'utilities/src/logger/logger'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'
import { useTestnetModeForLoggingAndAnalytics } from 'wallet/src/features/testnetMode/hooks'
import { SharedWalletProvider } from 'wallet/src/providers/SharedWalletProvider'

getLocalUserId()
  .then((userId) => {
    initializeSentry(SentryAppNameTag.UnitagClaim, userId)
  })
  .catch((error) => {
    logger.error(error, {
      tags: { file: 'UnitagClaimApp.tsx', function: 'getLocalUserId' },
    })
  })

const router = sentryCreateHashRouter([
  {
    path: '',
    element: <UnitagClaimAppInner />,
    errorElement: <ErrorElement />,
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

function UnitagClaimAppInner(): JSX.Element {
  useTestnetModeForLoggingAndAnalytics()
  return (
    <Flex alignItems="center" justifyContent="center" minHeight="100vh" width="100%">
      <OnboardingStepsProvider
        disableRedirect
        steps={{
          [ClaimUnitagSteps.Intro]: <UnitagIntroScreen />,
          [ClaimUnitagSteps.CreateUsername]: <UnitagCreateUsernameScreen />,
          [ClaimUnitagSteps.ChooseProfilePic]: <UnitagChooseProfilePicScreen />,
        }}
        ContainerComponent={UnitagClaimContextProvider}
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
        <ExtensionStatsigProvider>
          <I18nextProvider i18n={i18n}>
            <SharedWalletProvider reduxStore={getReduxStore()}>
              <ErrorBoundary>
                <GraphqlProvider>
                  <LocalizationContextProvider>
                    <UnitagUpdaterContextProvider>
                      <TraceUserProperties />
                      <RouterProvider router={router} />
                    </UnitagUpdaterContextProvider>
                  </LocalizationContextProvider>
                </GraphqlProvider>
              </ErrorBoundary>
            </SharedWalletProvider>
          </I18nextProvider>
        </ExtensionStatsigProvider>
      </PersistGate>
    </Trace>
  )
}
