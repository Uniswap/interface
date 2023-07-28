import { useEffect } from 'react'
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom'
import { OnboardingContextProvider } from 'src/app/features/onboarding/OnboardingContextProvider'
import {
  CreateOnboardingRoutes,
  ImportOnboardingRoutes,
  OnboardingRoutes,
  TopLevelRoutes,
} from 'src/app/navigation/constants'
import { useAppSelector } from 'src/background/store'
import { isOnboardedSelector } from 'src/background/utils/onboardingUtils'
import { Stack } from 'ui/src'
import { UniswapLogo } from 'ui/src/assets/icons/UniswapLogo'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

export function OnboardingWrapper(): JSX.Element {
  // check which onboarding flow we're in (/create or /import) so we can redirect to the correct complete route if user is already onboarded
  const isCreate = !!useMatch(`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Create}/*`)

  const completeRoute = isCreate
    ? `/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Create}/${CreateOnboardingRoutes.Complete}`
    : `/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Import}/${ImportOnboardingRoutes.Complete}`

  const isOnboarded = useAppSelector(isOnboardedSelector)
  const hasActiveAccount = !!useActiveAccount()
  const location = useLocation()
  const navigate = useNavigate()

  const isIntroRoute = !!useMatch(TopLevelRoutes.Onboarding)

  useEffect(() => {
    if (
      isOnboarded &&
      hasActiveAccount &&
      location.pathname !== completeRoute &&
      // to account for cases where a user ends up (manually or through browser history) at "/onboarding" after completing onboarding
      !isIntroRoute
    ) {
      navigate(completeRoute, { replace: true })
    }
  }, [isOnboarded, hasActiveAccount, location, completeRoute, navigate, isIntroRoute])

  return (
    <OnboardingContextProvider>
      <Stack alignItems="center" backgroundColor="$background1" minHeight="100vh" width="100%">
        <Stack padding="$spacing12">
          {/* TODO: make generic Icon component that can use `currentColor` in SVGs and be more easily reused */}
          <UniswapLogo />
        </Stack>
        <Outlet />
      </Stack>
    </OnboardingContextProvider>
  )
}
