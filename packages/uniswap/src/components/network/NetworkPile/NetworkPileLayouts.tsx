import { Flex } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import type {
  BackgroundColorToken,
  BorderRadiusToken,
  LogoSizeConfig,
  MultiLogoSizeConfig,
} from 'uniswap/src/components/network/NetworkPile/NetworkPile'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'

function getLogoStyle(size: number): { width: number; height: number } {
  return { width: size, height: size }
}

interface BackgroundMaskProps {
  borderRadius: BorderRadiusToken
  size: number
}

// Adds a solid background layer to prevent visibility through the logo
// due to the semi-transparent $statusCritical2 background color.
const BackgroundMask = ({ borderRadius, size }: BackgroundMaskProps): JSX.Element => (
  <Flex backgroundColor="$surface1" borderRadius={borderRadius} style={getLogoStyle(size)} position="absolute" />
)

interface SingleLogoProps {
  chainId: UniverseChainId
  config: LogoSizeConfig
}

export const SingleLogo = ({ chainId, config }: SingleLogoProps): JSX.Element => (
  <Flex centered borderRadius={config.borderRadius} style={getLogoStyle(config.size)}>
    <NetworkLogo chainId={chainId} size={config.size} />
  </Flex>
)

interface PileLogoItemProps {
  chainId: UniverseChainId
  config: MultiLogoSizeConfig
  backgroundColor: BackgroundColorToken
  position?: { top?: number; bottom?: number; left?: number; right?: number }
  zIndex?: number
}

// Internal component used by DoubleLogo, TripleLogo, and QuadLogo
const PileLogoItem = ({
  chainId,
  config,
  backgroundColor,
  position,
  zIndex = zIndexes.mask,
}: PileLogoItemProps): JSX.Element => {
  // BackgroundMask is needed for semi-transparent backgrounds to prevent visibility through the logo
  const needsBackgroundMask = backgroundColor === '$statusCritical2'

  return (
    <Flex position="absolute" zIndex={zIndex} {...position}>
      {needsBackgroundMask && <BackgroundMask borderRadius={config.borderRadius} size={config.outer} />}
      <Flex
        centered
        backgroundColor={backgroundColor}
        borderRadius={config.borderRadius}
        style={getLogoStyle(config.outer)}
      >
        <NetworkLogo chainId={chainId} size={config.inner} />
      </Flex>
    </Flex>
  )
}

interface DoubleLogoProps {
  chainIds: [UniverseChainId, UniverseChainId]
  config: MultiLogoSizeConfig
  backgroundColor: BackgroundColorToken
}

export const DoubleLogo = ({ chainIds, config, backgroundColor }: DoubleLogoProps): JSX.Element => (
  <>
    <PileLogoItem
      chainId={chainIds[0]}
      config={config}
      backgroundColor={backgroundColor}
      position={{ top: 0, left: 0 }}
    />
    <PileLogoItem
      chainId={chainIds[1]}
      config={config}
      backgroundColor={backgroundColor}
      position={{ bottom: 0, right: 0 }}
      zIndex={zIndexes.mask + 1}
    />
  </>
)

interface TripleLogoProps {
  chainIds: [UniverseChainId, UniverseChainId, UniverseChainId]
  config: MultiLogoSizeConfig
  backgroundColor: BackgroundColorToken
}

export const TripleLogo = ({ chainIds, config, backgroundColor }: TripleLogoProps): JSX.Element => (
  <>
    <PileLogoItem
      chainId={chainIds[0]}
      config={config}
      backgroundColor={backgroundColor}
      position={{ top: 0, left: 0 }}
    />
    <PileLogoItem
      chainId={chainIds[2]}
      config={config}
      backgroundColor={backgroundColor}
      position={{ bottom: 0, right: 0 }}
    />
    <PileLogoItem chainId={chainIds[1]} config={config} backgroundColor={backgroundColor} zIndex={zIndexes.mask + 1} />
  </>
)

interface QuadLogoProps {
  chainIds: [UniverseChainId, UniverseChainId, UniverseChainId, UniverseChainId]
  config: MultiLogoSizeConfig
  backgroundColor: BackgroundColorToken
}

// Z pattern: chainIds[0] → top-left, [1] → top-right, [2] → bottom-left, [3] → bottom-right
// Descending z-index: top-left (front) → top-right → bottom-left → bottom-right (back)
export const QuadLogo = ({ chainIds, config, backgroundColor }: QuadLogoProps): JSX.Element => (
  <>
    <PileLogoItem
      chainId={chainIds[0]}
      config={config}
      backgroundColor={backgroundColor}
      position={{ top: 0, left: 0 }}
      zIndex={zIndexes.mask + 3}
    />
    <PileLogoItem
      chainId={chainIds[1]}
      config={config}
      backgroundColor={backgroundColor}
      position={{ top: 0, right: 0 }}
      zIndex={zIndexes.mask + 2}
    />
    <PileLogoItem
      chainId={chainIds[2]}
      config={config}
      backgroundColor={backgroundColor}
      position={{ bottom: 0, left: 0 }}
      zIndex={zIndexes.mask + 1}
    />
    <PileLogoItem
      chainId={chainIds[3]}
      config={config}
      backgroundColor={backgroundColor}
      position={{ bottom: 0, right: 0 }}
      zIndex={zIndexes.mask}
    />
  </>
)
