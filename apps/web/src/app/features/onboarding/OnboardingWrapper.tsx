import { Navigate, Outlet, useMatch } from 'react-router-dom'
import { OnboardingContextProvider } from 'src/app/features/onboarding/OnboardingContextProvider'
import { OnboardingRoutes, TopLevelRoutes } from 'src/app/navigation/constants'
import { isOnboardedSelector } from 'src/background/utils/onboardingUtils'
import { Stack } from 'ui/src'
import { UniswapLogo } from 'ui/src/assets/icons/UniswapLogo'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { useAppSelector } from 'wallet/src/state'

const onboardingCompleteRoute = `/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Complete}`

export function OnboardingWrapper(): JSX.Element {
  const isOnboarded = useAppSelector(isOnboardedSelector)
  const hasActiveAccount = !!useActiveAccount()
  const isInOnboardingCompleteRoute = !!useMatch(onboardingCompleteRoute)

  // We check for `hasActiveAccount` to make sure the onboarding process is 100% complete before triggering the redirect or else it would redirect too soon.
  return isOnboarded && hasActiveAccount && !isInOnboardingCompleteRoute ? (
    <Navigate replace to={onboardingCompleteRoute} />
  ) : (
    <OnboardingContextProvider>
      <Stack
        alignItems="center"
        backgroundColor="$background1"
        minHeight="100vh"
        theme="primary"
        width="100%">
        <Stack padding="$spacing12">
          {/* TODO: make generic Icon component that can use `currentColor` in SVGs and be more easily reused */}
          <UniswapLogo />
        </Stack>
        <Stack flex={1} padding="$spacing12">
          <Outlet />
        </Stack>
      </Stack>
    </OnboardingContextProvider>
  )
}
