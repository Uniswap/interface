import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'
import { Flex } from 'ui/src/components/layout'
import { Unicon } from 'ui/src/components/Unicon'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { useActiveAccountAddressWithThrow, useDisplayName } from 'wallet/src/features/wallet/hooks'

export function NetworkAndWalletSummary(): JSX.Element {
  const { t } = useTranslation()
  const address = useActiveAccountAddressWithThrow()
  const displayName = useDisplayName(address)?.name

  return (
    <Flex grow gap="$spacing16">
      <Flex grow row justifyContent="space-between">
        <Flex>
          <Text color="$neutral2" variant="bodySmall">
            {t('Network fee')}
          </Text>
        </Flex>

        <Flex>$ZZ.ZZ</Flex>
      </Flex>

      <Flex grow row justifyContent="space-between">
        <Flex>
          <Text color="$neutral2" variant="bodySmall">
            {t('Wallet')}
          </Text>
        </Flex>

        <Flex centered row gap="$spacing8">
          <Unicon address={address} size={iconSizes.icon16} />
          <Text variant="subheadSmall">{displayName}</Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
