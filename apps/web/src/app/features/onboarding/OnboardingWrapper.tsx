import { Outlet } from 'react-router-dom'
import { Stack } from 'ui'
import { UniswapLogo } from 'ui/assets/icons/UniswapLogo'

export function OnboardingWrapper(): JSX.Element {
  return (
    <Stack alignItems="center" backgroundColor="$background1" minHeight="100vh" width="100%">
      <Stack padding="$spacing12" position="absolute" theme="primary">
        {/* TODO: make generic Icon component that can use `currentColor` in SVGs and be more easily reused */}
        <UniswapLogo />
      </Stack>
      <Outlet />
    </Stack>
  )
}
