import { Outlet } from 'react-router-dom'
import { Circle, Stack, XStack } from 'ui/src'
import { UniswapLogo } from 'wallet/src/assets/UniswapLogo'

export function OnboardingWrapper(): JSX.Element {
  return (
    <Stack
      alignItems="center"
      backgroundColor="$background1"
      minHeight="100vh"
      width="100%">
      <Stack padding="$spacing12" position="absolute" theme="primary">
        {/* TODO: make generic Icon component that can use `currentColor` in SVGs and be more easily reused */}
        <UniswapLogo />
      </Stack>
      <Stack
        alignItems="center"
        flexGrow={1}
        justifyContent="center"
        marginBottom="$spacing60"
        width="100%">
        <Outlet />
      </Stack>
      {/* TODO: actually associate these with the step. */}
      <XStack gap="$spacing12" marginBottom="$spacing36">
        <Circle backgroundColor="$textPrimary" size={9} />
        <Circle
          backgroundColor="$background1"
          borderColor="$backgroundOutline"
          borderWidth={2}
          size={9}
        />
        <Circle
          backgroundColor="$background1"
          borderColor="$backgroundOutline"
          borderWidth={2}
          size={9}
        />
        <Circle
          backgroundColor="$background1"
          borderColor="$backgroundOutline"
          borderWidth={2}
          size={9}
        />
      </XStack>
    </Stack>
  )
}
