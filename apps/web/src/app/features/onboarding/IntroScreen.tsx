import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ONBOARDING_CONTENT_WIDTH } from 'src/app/features/onboarding/utils'
import {
  CreateOnboardingRoutes,
  ImportOnboardingRoutes,
  OnboardingRoutes,
} from 'src/app/navigation/constants'
import { useAppSelector } from 'src/background/store'
import { isOnboardedSelector } from 'src/background/utils/onboardingUtils'
import { Button, Image, Stack, Text, XStack, YStack } from 'ui/src'
import { UNISWAP_LOGO } from 'ui/src/assets'
import { iconSizes } from 'ui/src/theme'

const INTRO_SCREEN_WIDTH = 320

export function IntroScreen(): JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const isOnboarded = useAppSelector(isOnboardedSelector)

  if (isOnboarded) {
    // this case will only be triggered if a user manually arrives directly on /onboarding after having completed onboarding
    return (
      <Stack
        alignItems="center"
        flexGrow={1}
        justifyContent="center"
        width={ONBOARDING_CONTENT_WIDTH}>
        <YStack alignItems="center" gap="$spacing12">
          <Text color="$neutral1" variant="subheadLarge">
            {t('You’ve already completed onboarding')}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="bodySmall">
            {t(
              'To create more wallets, open the account switcher inside the extension popup, or reinstall the extension to start over'
            )}
          </Text>
        </YStack>
      </Stack>
    )
  }

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
            backgroundColor="$sporeWhite"
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
          <Text color="$accent1" textAlign="center" variant="headlineMedium">
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
          {t('Create a new wallet')}
        </Button>
        <Button
          flexGrow={1}
          theme="secondary"
          onPress={(): void =>
            navigate(`${OnboardingRoutes.Import}/${ImportOnboardingRoutes.Password}`, {
              replace: true,
            })
          }>
          {t('I already have a wallet')}
        </Button>
      </YStack>
    </XStack>
  )
}
