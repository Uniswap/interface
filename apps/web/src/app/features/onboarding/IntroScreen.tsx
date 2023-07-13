import { useNavigate } from 'react-router-dom'
import {
  CreateOnboardingRoutes,
  ImportOnboardingRoutes,
  OnboardingRoutes,
} from 'src/app/navigation/constants'
import { Image, Stack, Text, XStack, YStack } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { Button } from 'ui/src/components/button/Button'
import { iconSizes } from 'ui/src/theme/iconSizes'

const INTRO_SCREEN_WIDTH = 320

export function IntroScreen(): JSX.Element {
  const navigate = useNavigate()
  return (
    <XStack
      alignItems="center"
      flexGrow={1}
      gap={100}
      justifyContent="center"
      marginBottom="$spacing60"
      minWidth={INTRO_SCREEN_WIDTH}>
      <YStack gap="$spacing12" width="100%">
        <Stack alignItems="center" justifyContent="center" paddingBottom="$spacing8">
          <Stack
            alignItems="center"
            backgroundColor="$white"
            borderRadius="$rounded24"
            flexGrow={0}
            justifyContent="center"
            padding="$spacing12">
            <Image
              height={iconSizes.icon64}
              source={UNISWAP_LOGO}
              theme="primary"
              width={iconSizes.icon64}
            />
          </Stack>
        </Stack>
        <Stack marginBottom="$spacing48">
          <Text textAlign="center" variant="headlineMedium">
            Welcome to
          </Text>
          <Text color="$magentaVibrant" textAlign="center" variant="headlineMedium">
            Uniswap Wallet
          </Text>
        </Stack>
        <Button
          flexGrow={1}
          theme="primary"
          onPress={(): void =>
            navigate(`${OnboardingRoutes.Create}/${CreateOnboardingRoutes.Password}`, {
              replace: true,
            })
          }>
          {/* TODO(EXT-207 / EXT-208): fix button component styling and derive text color from theme */}
          <Text color="$white" variant="buttonLabelMedium">
            Create a new wallet
          </Text>
        </Button>
        <Button
          flexGrow={1}
          theme="secondary"
          onPress={(): void =>
            navigate(`${OnboardingRoutes.Import}/${ImportOnboardingRoutes.Password}`, {
              replace: true,
            })
          }>
          {/* TODO(EXT-207 / EXT-208): fix button component styling and derive text color from theme */}
          <Text color="$textPrimary" variant="buttonLabelMedium">
            I already have a wallet
          </Text>
        </Button>
      </YStack>
    </XStack>
  )
}
