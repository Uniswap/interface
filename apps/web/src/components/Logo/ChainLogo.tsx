import { CSSProperties } from 'react'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import {
  ARBITRUM_LOGO,
  ASTROCHAIN_SEPOLIA_LOGO,
  AVALANCHE_LOGO,
  BASE_LOGO,
  BLAST_LOGO,
  BNB_LOGO,
  CELO_LOGO,
  ETHEREUM_LOGO,
  OPTIMISM_LOGO,
  POLYGON_LOGO,
  WORLD_CHAIN_LOGO,
  ZKSYNC_LOGO,
  ZORA_LOGO,
} from 'ui/src/assets'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

type ChainUI = { symbol: string; bgColor: string; textColor: string }

export function getChainUI(chainId: UniverseChainId, darkMode: boolean): ChainUI
export function getChainUI(chainId: UniverseChainId, darkMode: boolean): ChainUI | undefined {
  switch (chainId) {
    case UniverseChainId.Mainnet:
    case UniverseChainId.Sepolia:
      return {
        symbol: ETHEREUM_LOGO,
        bgColor: '#6B8AFF33',
        textColor: '#6B8AFF',
      }
    case UniverseChainId.Polygon:
      return {
        symbol: POLYGON_LOGO,
        bgColor: '#9558FF33',
        textColor: '#9558FF',
      }
    case UniverseChainId.ArbitrumOne:
      return {
        symbol: ARBITRUM_LOGO,
        bgColor: '#00A3FF33',
        textColor: '#00A3FF',
      }
    case UniverseChainId.Optimism:
      return {
        symbol: OPTIMISM_LOGO,
        bgColor: '#FF042033',
        textColor: '#FF0420',
      }
    case UniverseChainId.Celo:
      return darkMode
        ? {
            symbol: CELO_LOGO,
            bgColor: '#FCFF5233',
            textColor: '#FCFF52',
          }
        : {
            symbol: CELO_LOGO,
            bgColor: '#FCFF5299',
            textColor: '#655947',
          }
    case UniverseChainId.Avalanche:
      return {
        symbol: AVALANCHE_LOGO,
        bgColor: '#E8414233',
        textColor: '#E84142',
      }
    case UniverseChainId.Bnb:
      return {
        symbol: BNB_LOGO,
        bgColor: '#EAB20033',
        textColor: '#EAB200',
      }
    case UniverseChainId.Base:
      return {
        symbol: BASE_LOGO,
        bgColor: '#0052FF33',
        textColor: '#0052FF',
      }
    case UniverseChainId.Blast:
      return darkMode
        ? {
            symbol: BLAST_LOGO,
            bgColor: 'rgba(252, 252, 3, 0.12)',
            textColor: 'rgba(252, 252, 3, 1) ',
          }
        : {
            symbol: BLAST_LOGO,
            bgColor: 'rgba(252, 252, 3, 0.16)',
            textColor: 'rgba(17, 20, 12, 1)',
          }
    case UniverseChainId.Zora:
      return darkMode
        ? {
            symbol: ZORA_LOGO,
            bgColor: 'rgba(255, 255, 255, 0.12)',
            textColor: '#FFFFFF',
          }
        : {
            symbol: ZORA_LOGO,
            bgColor: 'rgba(0, 0, 0, 0.12)',
            textColor: '#000000',
          }
    case UniverseChainId.Zksync:
      return darkMode
        ? {
            symbol: ZKSYNC_LOGO,
            bgColor: 'rgba(97, 137, 255, 0.12)',
            textColor: '#6189FF',
          }
        : {
            symbol: ZKSYNC_LOGO,
            bgColor: 'rgba(54, 103, 246, 0.12)',
            textColor: '#3667F6',
          }
    case UniverseChainId.WorldChain:
      return darkMode
        ? {
            symbol: WORLD_CHAIN_LOGO,
            bgColor: 'rgba(255, 255, 255, 0.12)',
            textColor: '#FFFFFF',
          }
        : {
            symbol: WORLD_CHAIN_LOGO,
            bgColor: 'rgba(0, 0, 0, 0.12)',
            textColor: '#000000',
          }
    case UniverseChainId.AstrochainSepolia:
      return {
        symbol: ASTROCHAIN_SEPOLIA_LOGO,
        bgColor: '#fc0fa4',
        textColor: '#fc0fa4',
      }
    default:
      return undefined
  }
}

const getDefaultBorderRadius = (size: number) => size / 2 - 4

type ChainLogoProps = {
  chainId: UniverseChainId
  className?: string
  size?: number
  borderRadius?: number
  style?: CSSProperties
  testId?: string
  fillContainer?: boolean
}
export function ChainLogo({
  chainId,
  style,
  size = 12,
  borderRadius = getDefaultBorderRadius(size),
  testId,
  fillContainer = false,
}: ChainLogoProps) {
  const darkMode = useIsDarkMode()
  const isSupportedChain = useIsSupportedChainId(chainId)

  if (!isSupportedChain) {
    return null
  }
  const { label } = getChainInfo(chainId)

  const { symbol } = getChainUI(chainId, darkMode)
  const iconSize = fillContainer ? '100%' : size + 'px'

  return symbol ? (
    <img
      aria-labelledby="titleID"
      data-testid={testId}
      width={iconSize}
      height={iconSize}
      src={symbol}
      style={{ ...style, borderRadius: borderRadius + 'px' }}
      alt={`${label} logo`}
    />
  ) : null
}
