import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NetworksInSeries } from 'uniswap/src/components/network/NetworkFilter'
import { WALLET_SUPPORTED_CHAIN_IDS } from 'uniswap/src/types/chains'

export function NetworksFooter(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex fill row alignItems="center" borderTopColor="$background" borderTopWidth="$spacing1" px="$spacing8">
      <Flex grow row alignItems="center" gap="$spacing4" justifyContent="space-between">
        <Text color="$neutral2" variant="body4">
          {t('extension.connection.networks')}
        </Text>
        <NetworksInSeries networkIconSize={iconSizes.icon16} networks={WALLET_SUPPORTED_CHAIN_IDS} />
      </Flex>
    </Flex>
  )
}
