import { useNavigate } from 'react-router-dom'
import {
  ImportOnboardingRoutes,
  OnboardingRoutes,
  TopLevelRoutes,
} from 'src/app/navigation/constants'
import { Stack, XStack } from 'tamagui'
import { Button } from 'ui/src/components/button/Button'

export function NameWallet(): JSX.Element {
  const navigate = useNavigate()

  return (
    <Stack alignItems="center" gap="$spacing36" minWidth={450}>
      <XStack gap="$spacing12" width="100%">
        <Button flexGrow={1} theme="secondary" onPress={(): void => navigate(-1)}>
          Back
        </Button>
        <Button
          flexGrow={1}
          theme="primary"
          onPress={(): void => {
            navigate(
              `/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Import}/${ImportOnboardingRoutes.Complete}`
            )
          }}>
          Next
        </Button>
      </XStack>
    </Stack>
  )
}
