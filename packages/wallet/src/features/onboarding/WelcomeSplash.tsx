import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Unitag } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'

export function WelcomeSplash({ address }: { address: Address }): JSX.Element {
  const { t } = useTranslation()
  const { unitag } = useUnitagByAddress(address)

  return (
    <Flex centered fill gap="$spacing40">
      <Flex centered>
        <AccountIcon
          address={address}
          avatarUri={unitag?.metadata?.avatar}
          showBackground={true}
          size={iconSizes.icon70}
        />
        {unitag?.username && (
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
            <Flex
              row
              centered
              animation="lazy"
              enterStyle={{ opacity: 0, scale: 0.8, x: 20 }}
              exitStyle={{ opacity: 0, scale: 0.8, x: -20 }}
            >
              <Unitag size="$icon.24" />
            </Flex>
          </Flex>
        )}
      </Flex>

      <Flex centered gap="$spacing16">
        <Text color="$neutral1" variant="heading3">
          {t('onboarding.welcome.title')}
        </Text>

        <Text color="$neutral2" variant="body1">
          {t('onboarding.welcome.subtitle')}
        </Text>
      </Flex>
    </Flex>
  )
}
