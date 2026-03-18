import '@tamagui/core/reset.css'
import 'src/app/Global.css'

import { PropsWithChildren, useEffect } from 'react'
import { createHashRouter, Outlet, RouterProvider, useSearchParams } from 'react-router'
import { ErrorElement } from 'src/app/components/ErrorElement'
import { BaseAppContainer } from 'src/app/core/BaseAppContainer'
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
import { Flex } from 'ui/src'
import { logger } from 'utilities/src/logger/logger'
import { usePrevious } from 'utilities/src/react/hooks'
import { useTestnetModeForLoggingAndAnalytics } from 'wallet/src/features/testnetMode/hooks/useTestnetModeForLoggingAndAnalytics'
import { useAccountAddressFromUrlWithThrow } from 'wallet/src/features/wallet/hooks'

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

// biome-ignore lint/suspicious/noExplicitAny: Router state object has dynamic structure from react-router
router.subscribe((state: any) => {
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
        // biome-ignore lint/suspicious/noExplicitAny: Router state object has dynamic structure from react-router
        .catch((e: any) => logger.error(e, { tags: { file: 'UnitagClaimApp.tsx', function: 'UnitagClaimAppInner' } }))
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
    <BaseAppContainer appName={DatadogAppNameTag.UnitagClaim}>
      <RouterProvider router={router} />
    </BaseAppContainer>
  )
}
