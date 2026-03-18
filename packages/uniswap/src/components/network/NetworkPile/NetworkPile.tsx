import { memo } from 'react'
import { Flex } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import {
  DoubleLogo,
  QuadLogo,
  SingleLogo,
  TripleLogo,
} from 'uniswap/src/components/network/NetworkPile/NetworkPileLayouts'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export type NetworkPileSize = 'default' | 'small'

export type BorderRadiusToken = '$rounded4' | '$rounded6' | '$rounded8'

export type BackgroundColorToken = '$statusCritical2' | '$surface1'

export interface LogoSizeConfig {
  size: number
  borderRadius: BorderRadiusToken
}

export interface MultiLogoSizeConfig {
  outer: number
  inner: number
  borderRadius: BorderRadiusToken
}

interface SizeConfig {
  container: number
  backgroundColor: BackgroundColorToken
  single: LogoSizeConfig
  double: MultiLogoSizeConfig
  triple: MultiLogoSizeConfig
  quad: MultiLogoSizeConfig
}

const MAX_LOGOS = 4

const LOGO_SIZES: Record<NetworkPileSize, SizeConfig> = {
  default: {
    container: iconSizes.icon32,
    backgroundColor: '$statusCritical2',
    single: { size: iconSizes.icon24, borderRadius: '$rounded8' },
    double: { outer: iconSizes.icon20, inner: iconSizes.icon18, borderRadius: '$rounded6' },
    triple: { outer: iconSizes.icon16, inner: 14, borderRadius: '$rounded4' },
    quad: { outer: iconSizes.icon16, inner: 14, borderRadius: '$rounded4' },
  },
  small: {
    container: iconSizes.icon20,
    backgroundColor: '$surface1',
    single: { size: iconSizes.icon20, borderRadius: '$rounded6' },
    double: { outer: 13, inner: 11, borderRadius: '$rounded6' },
    triple: { outer: 10, inner: 9, borderRadius: '$rounded6' },
    quad: { outer: 10, inner: 9, borderRadius: '$rounded6' },
  },
} as const

interface NetworkPileProps {
  chainIds?: UniverseChainId[]
  size?: NetworkPileSize
}

export const NetworkPile = memo(function NetworkPile({
  chainIds = [],
  size = 'default',
}: NetworkPileProps): JSX.Element {
  const config = LOGO_SIZES[size]

  const renderLogos = (): JSX.Element | null => {
    const logoCount = Math.min(chainIds.length, MAX_LOGOS) as 1 | 2 | 3 | 4

    if (!chainIds.length) {
      return null
    }

    const logoComponents: Record<1 | 2 | 3 | 4, JSX.Element | null> = {
      1: chainIds[0] ? <SingleLogo chainId={chainIds[0]} config={config.single} /> : null,
      2:
        chainIds.length >= 2 ? (
          <DoubleLogo
            chainIds={[chainIds[0], chainIds[1]] as [UniverseChainId, UniverseChainId]}
            config={config.double}
            backgroundColor={config.backgroundColor}
          />
        ) : null,
      3:
        chainIds.length >= 3 ? (
          <TripleLogo
            chainIds={[chainIds[0], chainIds[1], chainIds[2]] as [UniverseChainId, UniverseChainId, UniverseChainId]}
            config={config.triple}
            backgroundColor={config.backgroundColor}
          />
        ) : null,
      4:
        chainIds.length >= 4 ? (
          <QuadLogo
            chainIds={
              [chainIds[0], chainIds[1], chainIds[2], chainIds[3]] as [
                UniverseChainId,
                UniverseChainId,
                UniverseChainId,
                UniverseChainId,
              ]
            }
            config={config.quad}
            backgroundColor={config.backgroundColor}
          />
        ) : null,
    }

    return logoComponents[logoCount]
  }

  return (
    <Flex centered height={config.container} width={config.container}>
      <Flex
        centered
        height={config.container}
        width={config.container}
        testID={TestID.NetworkPile}
        pointerEvents="auto"
        position="relative"
      >
        {renderLogos()}
      </Flex>
    </Flex>
  )
})
