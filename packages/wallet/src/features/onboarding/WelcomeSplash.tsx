import { useTranslation } from 'react-i18next'
import Animated, { Easing, FadeIn, FadeInDown, RotateInUpLeft } from 'react-native-reanimated'
import { Button, Flex, Text } from 'ui/src'
import { Unitag } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { isExtensionApp } from 'utilities/src/platform'

export function WelcomeSplash({
  address,
  onContinue,
  pb,
}: {
  address: Address
  onContinue: () => void
  pb?: number
}): JSX.Element {
  const { t } = useTranslation()
  const { data: unitag } = useUnitagsAddressQuery({
    params: address ? { address } : undefined,
  })

  return (
    <Flex fill>
      <Flex centered fill gap={isExtensionApp ? '$spacing24' : '$spacing40'} pb={pb}>
        <Flex centered>
          <Animated.View entering={FadeInDown.duration(300)}>
            <AccountIcon
              address={address}
              avatarUriOverride={unitag?.metadata?.avatar}
              showBackground={true}
              size={iconSizes.icon70}
            />
          </Animated.View>
          {unitag?.username && (
            <Animated.View
              entering={RotateInUpLeft.duration(300)
                .delay(200)
                .withInitialValues({
                  opacity: 0,
                  transform: [{ rotate: '15deg' }, { translateX: 0 }, { translateY: 20 }],
                })
                .springify()}
            >
              <Flex
                row
                gap="$spacing4"
                shadowColor="$neutral1"
                shadowOpacity={0.08}
                shadowRadius={5}
                shadowOffset={{ width: 0, height: 5 }}
                borderWidth="$spacing1"
                borderColor="$surface2"
                borderRadius="$rounded32"
                backgroundColor="$surface1"
                px="$spacing12"
                py="$spacing8"
                transform={[{ rotate: '-2deg' }, { translateY: -10 }]}
              >
                <Text color="$neutral1" variant="subheading1">
                  {unitag.username}
                </Text>
                <Unitag size="$icon.24" />
              </Flex>
            </Animated.View>
          )}
        </Flex>

        <Animated.View entering={FadeInDown.duration(300).delay(400).easing(Easing.ease)}>
          <Flex centered gap="$spacing16">
            <Text color="$neutral1" variant="heading3">
              {t('onboarding.welcome.title')}
            </Text>

            <Text color="$neutral2" variant="body1">
              {t('onboarding.welcome.subtitle')}
            </Text>
          </Flex>
        </Animated.View>
      </Flex>

      <Animated.View entering={FadeIn.duration(300).delay(400).easing(Easing.ease)}>
        <Flex row>
          <Button size="large" variant="branded" onPress={onContinue}>
            {t('common.button.continue')}
          </Button>
        </Flex>
      </Animated.View>
    </Flex>
  )
}
