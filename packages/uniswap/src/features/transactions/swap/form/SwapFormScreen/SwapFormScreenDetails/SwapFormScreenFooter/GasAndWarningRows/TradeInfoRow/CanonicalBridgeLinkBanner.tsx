import { Flex, Text, TouchableArea } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { iconSizes, validColor } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { useNetworkColors } from 'uniswap/src/utils/colors'
import { openUri } from 'uniswap/src/utils/linking'

export function CanonicalBridgeLinkBanner({ chainId }: { chainId: UniverseChainId }): JSX.Element | null {
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
          {networkLabel} Bridge
        </Text>
        <Arrow color={networkColor} direction="ne" size={iconSizes.icon20} />
      </Flex>
    </TouchableArea>
  )
}
