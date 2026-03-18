import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingStepsContext'
import { Terms } from 'src/app/features/onboarding/Terms'
import { UnitagClaimRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { Button, Flex, GeneratedIcon, Text } from 'ui/src'
import { Bolt, Coupon, Person } from 'ui/src/components/icons'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { useAccountAddressFromUrlWithThrow } from 'wallet/src/features/wallet/hooks'

const CONTAINER_WIDTH = 531
const TERMS_WIDTH = 300

export function UnitagIntroScreen(): JSX.Element {
  const { t } = useTranslation()
  const { goToNextStep } = useOnboardingSteps()

  const address = useAccountAddressFromUrlWithThrow()
  const { data: unitag } = useUnitagsAddressQuery({
    params: address ? { address } : undefined,
  })

  useEffect(() => {
    if (unitag?.address) {
      navigate(`/${UnitagClaimRoutes.EditProfile}`)
    }
  }, [unitag])

  return (
    <Flex centered height="100%" width="100%">
      <Flex centered width={CONTAINER_WIDTH} gap="$spacing40">
        <Flex gap="$spacing12">
          <Text color="$neutral1" variant="heading2" textAlign="center">
            {t('unitags.extension.intro.title')}
          </Text>
          <Text color="$neutral2" variant="subheading1" textAlign="center">
            {t('unitags.extension.intro.description')}
          </Text>
        </Flex>
        <Flex gap="$spacing40" style={{ width: 'fit-content' }}>
          <Flex centered gap="$spacing12">
            <Flex row gap="$spacing12">
              <UnitagIntroPill text={t('unitags.extension.intro.upsell.customizable')} Icon={Person} />
              <UnitagIntroPill text={t('unitags.extension.intro.upsell.free')} Icon={Coupon} />
            </Flex>
            <UnitagIntroPill text={t('unitags.extension.intro.upsell.ens')} Icon={Bolt} />
          </Flex>

          <Flex gap="$spacing24">
            <Flex row>
              <Button size="large" variant="branded" onPress={() => goToNextStep()}>
                {t('unitags.extension.intro.buttton')}
              </Button>
            </Flex>
            <Flex width={TERMS_WIDTH} alignSelf="center">
              <Terms />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

function UnitagIntroPill({ Icon, text }: { Icon: GeneratedIcon; text: string }): JSX.Element {
  return (
    <Flex row gap="$spacing8" p="$spacing12" borderWidth="$spacing1" borderColor="$surface3" borderRadius="$rounded16">
      <Icon color="$accent1" size="$icon.24" />
      <Text color="$neutral2" variant="body1">
        {text}
      </Text>
    </Flex>
  )
}
