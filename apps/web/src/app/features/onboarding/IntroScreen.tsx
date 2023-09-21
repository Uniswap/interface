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
import { Button, Flex, Image, Text } from 'ui/src'
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
      <Flex centered grow width={ONBOARDING_CONTENT_WIDTH}>
        <Flex alignItems="center" gap="$spacing12">
          <Text color="$neutral1" variant="subheading1">
            {t('You’ve already completed onboarding')}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="body2">
            {t(
              'To create more wallets, open the account switcher inside the extension popup, or reinstall the extension to start over'
            )}
          </Text>
        </Flex>
      </Flex>
    )
  }

  return (
    <Flex centered grow row gap={100} mb="$spacing60" minWidth={INTRO_SCREEN_WIDTH}>
      <Flex gap="$spacing12" width="100%">
        <Flex centered pb="$spacing8">
          <Flex centered bg="$sporeWhite" borderRadius="$rounded24" flexGrow={0} p="$spacing12">
            <Image
              height={iconSizes.icon64}
              source={UNISWAP_LOGO}
              theme="primary"
              width={iconSizes.icon64}
            />
          </Flex>
        </Flex>
        <Flex mb="$spacing48">
          <Text textAlign="center" variant="heading2">
            Welcome to
          </Text>
          <Text color="$accent1" textAlign="center" variant="heading2">
            Uniswap Wallet
          </Text>
        </Flex>
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
      </Flex>
    </Flex>
  )
}
