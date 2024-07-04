import { SupportedInterfaceChainId, getChain, useIsSupportedChainId } from 'constants/chains'
import { CSSProperties } from 'react'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import {
  ARBITRUM_LOGO,
  AVALANCHE_LOGO,
  BASE_LOGO,
  BLAST_LOGO,
  BNB_LOGO,
  CELO_LOGO,
  ETHEREUM_LOGO,
  OPTIMISM_LOGO,
  POLYGON_LOGO,
  ZKSYNC_LOGO,
  ZORA_LOGO,
} from 'ui/src/assets'
import { InterfaceChainId, UniverseChainId } from 'uniswap/src/types/chains'

type ChainUI = { symbol: string; bgColor: string; textColor: string }

export function getChainUI(chainId: SupportedInterfaceChainId, darkMode: boolean): ChainUI
export function getChainUI(chainId: InterfaceChainId, darkMode: boolean): ChainUI | undefined {
  switch (chainId) {
    case UniverseChainId.Mainnet:
    case UniverseChainId.Goerli:
    case UniverseChainId.Sepolia:
      return {
        symbol: ETHEREUM_LOGO,
        bgColor: '#6B8AFF33',
        textColor: '#6B8AFF',
      }
    case UniverseChainId.Polygon:
    case UniverseChainId.PolygonMumbai:
      return {
        symbol: POLYGON_LOGO,
        bgColor: '#9558FF33',
        textColor: '#9558FF',
      }
    case UniverseChainId.ArbitrumOne:
    case UniverseChainId.ArbitrumGoerli:
      return {
        symbol: ARBITRUM_LOGO,
        bgColor: '#00A3FF33',
        textColor: '#00A3FF',
      }
    case UniverseChainId.Optimism:
    case UniverseChainId.OptimismGoerli:
      return {
        symbol: OPTIMISM_LOGO,
        bgColor: '#FF042033',
        textColor: '#FF0420',
      }
    case UniverseChainId.Celo:
    case UniverseChainId.CeloAlfajores:
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
            bgColor: 'rgba(174, 180, 255, 0.08)',
            textColor: '#AEB4FF',
          }
        : {
            symbol: ZORA_LOGO,
            bgColor: 'rgba(65, 71, 148, 0.12)',
            textColor: '#414794',
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
    default:
      return undefined
  }
}

const getDefaultBorderRadius = (size: number) => size / 2 - 4

type ChainLogoProps = {
  chainId: InterfaceChainId
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
  const { label } = getChain({ chainId })

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
