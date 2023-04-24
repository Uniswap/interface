import { Outlet } from 'react-router-dom'
import { Stack, Text } from 'ui/src'

export function OnboardingWrapper(): JSX.Element {
  return (
    <Stack alignItems="center" backgroundColor="$background2" minHeight="100vh">
      <Text flexGrow={0} fontSize={40} paddingVertical="$spacing16">
        🦄
      </Text>
      <Stack
        alignItems="center"
        flexGrow={1}
        justifyContent="center"
        marginBottom="$spacing60">
        <Outlet />
      </Stack>
    </Stack>
  )
}
