import { Outlet } from 'react-router-dom'
import { OnboardingContextProvider } from 'src/app/features/onboarding/OnboardingContextProvider'
import { Stack } from 'ui/src'
import { UniswapLogo } from 'ui/src/assets/icons/UniswapLogo'

export function OnboardingWrapper(): JSX.Element {
  return (
    <OnboardingContextProvider>
      <Stack alignItems="center" backgroundColor="$background1" minHeight="100vh" width="100%">
        <Stack padding="$spacing12" position="absolute" theme="primary">
          {/* TODO: make generic Icon component that can use `currentColor` in SVGs and be more easily reused */}
          <UniswapLogo />
        </Stack>
        <Outlet />
      </Stack>
    </OnboardingContextProvider>
  )
}
