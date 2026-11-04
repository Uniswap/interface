import { UniverseChainId } from '@universe/chains'
import { Flex, Text, TouchableArea, validColor, iconSizes } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { useNetworkColors } from 'uniswap/src/utils/colors'
import { openUri } from 'uniswap/src/utils/linking'

export function CanonicalBridgeLinkBanner({ chainId }: { chainId: UniverseChainId }): JSX.Element | null {
  const { t } = useTranslation()
  const { foreground } = useNetworkColors(chainId)
  const canonicalBridgeUrl = getChainInfo(chainId).bridge

  if (!canonicalBridgeUrl) {
    return null
  }

  const networkLabel = getChainLabel(chainId)
  const networkColor = validColor(foreground)

  return (
    <TouchableArea onPress={() => openUri({ uri: canonicalBridgeUrl })}>
      <Flex row gap="$spacing8" alignItems="center">
        <NetworkLogo chainId={chainId} size={iconSizes.icon20} />
        <Text color={networkColor} variant="buttonLabel3">
          {t('swap.warning.noQuotesFound.bridgeLink', { network: networkLabel })}
        </Text>
        <Arrow color={networkColor} direction="ne" size={iconSizes.icon20} />
      </Flex>
    </TouchableArea>
  )
}
