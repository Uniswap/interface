import { isExtensionApp } from '@universe/environment'
import { useTranslation } from 'react-i18next'
import Animated, { Easing, FadeIn, FadeInDown, RotateInUpLeft } from 'react-native-reanimated'
import { Button, Flex, SpinningLoader, Text } from 'ui/src'
import { Unitag } from 'ui/src/components/icons'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { iconSizes } from 'ui/src/theme'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { shortenAddress } from 'utilities/src/addresses'

export function PasskeyImportConfirm({
  address,
  isImporting,
  onPressImport,
  pb,
  walletCount = 1,
}: {
  address: Address
  isImporting: boolean
  onPressImport: () => void
  pb?: number
  walletCount?: number
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
                {unitag?.username ?? shortenAddress({ address })}
              </Text>
              {unitag?.username && <Unitag size="$icon.24" />}
            </Flex>
          </Animated.View>
        </Flex>

        <Animated.View entering={FadeInDown.duration(300).delay(400).easing(Easing.ease)}>
          <Flex centered gap="$spacing16">
            <Text color="$neutral1" variant="heading3">
              {t('onboarding.passkey.found.title')}
            </Text>

            <Text color="$neutral2" textAlign="center" variant="body2">
              {t('onboarding.passkey.found.subtitle', { count: walletCount })}
            </Text>
          </Flex>
        </Animated.View>
      </Flex>

      <Animated.View entering={FadeIn.duration(300).delay(400).easing(Easing.ease)}>
        <Flex row>
          <Button
            icon={
              isImporting ? (
                <SpinningLoader size={iconSizes.icon24} color="$white" />
              ) : (
                <Passkey size={iconSizes.icon24} color="$white" />
              )
            }
            size="large"
            variant="branded"
            disabled={isImporting}
            onPress={onPressImport}
          >
            {isImporting ? undefined : t('onboarding.passkey.found.importButton')}
          </Button>
        </Flex>
      </Animated.View>
    </Flex>
  )
}
