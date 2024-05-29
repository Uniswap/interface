import { ChainId } from '@uniswap/sdk-core'
import { SupportedInterfaceChainId, getChainInfo, useIsSupportedChainId } from 'constants/chains'
import { CSSProperties, FunctionComponent } from 'react'
import { useTheme } from 'styled-components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

import { ReactComponent as arbitrum } from './ChainSymbols/arbitrum.svg'
import { ReactComponent as avax } from './ChainSymbols/avax.svg'
import { ReactComponent as base } from './ChainSymbols/base.svg'
import { ReactComponent as blast } from './ChainSymbols/blast.svg'
import { ReactComponent as blastLight } from './ChainSymbols/blast_light.svg'
import { ReactComponent as bnb } from './ChainSymbols/bnb.svg'
import { ReactComponent as celo } from './ChainSymbols/celo.svg'
import { ReactComponent as celoLight } from './ChainSymbols/celo_light.svg'
import { ReactComponent as ethereum } from './ChainSymbols/ethereum.svg'
import { ReactComponent as optimism } from './ChainSymbols/optimism.svg'
import { ReactComponent as polygon } from './ChainSymbols/polygon.svg'

type SVG = FunctionComponent<React.SVGProps<SVGSVGElement>>
type ChainUI = { Symbol: SVG; bgColor: string; textColor: string }

export function getChainUI(chainId: SupportedInterfaceChainId, darkMode: boolean): ChainUI
export function getChainUI(chainId: ChainId, darkMode: boolean): ChainUI | undefined {
  switch (chainId) {
    case ChainId.MAINNET:
    case ChainId.GOERLI:
    case ChainId.SEPOLIA:
      return {
        Symbol: ethereum,
        bgColor: '#6B8AFF33',
        textColor: '#6B8AFF',
      }
    case ChainId.POLYGON:
    case ChainId.POLYGON_MUMBAI:
      return {
        Symbol: polygon,
        bgColor: '#9558FF33',
        textColor: '#9558FF',
      }
    case ChainId.ARBITRUM_ONE:
    case ChainId.ARBITRUM_GOERLI:
    case ChainId.ARBITRUM_SEPOLIA:
      return {
        Symbol: arbitrum,
        bgColor: '#00A3FF33',
        textColor: '#00A3FF',
      }
    case ChainId.OPTIMISM:
    case ChainId.OPTIMISM_GOERLI:
      return {
        Symbol: optimism,
        bgColor: '#FF042033',
        textColor: '#FF0420',
      }
    case ChainId.CELO:
    case ChainId.CELO_ALFAJORES:
      return darkMode
        ? {
            Symbol: celo,
            bgColor: '#FCFF5233',
            textColor: '#FCFF52',
          }
        : {
            Symbol: celoLight,
            bgColor: '#FCFF5299',
            textColor: '#655947',
          }
    case ChainId.AVALANCHE:
      return {
        Symbol: avax,
        bgColor: '#E8414233',
        textColor: '#E84142',
      }
    case ChainId.BNB:
      return {
        Symbol: bnb,
        bgColor: '#EAB20033',
        textColor: '#EAB200',
      }
    case ChainId.BASE:
      return {
        Symbol: base,
        bgColor: '#0052FF33',
        textColor: '#0052FF',
      }
    case ChainId.BLAST:
      return darkMode
        ? {
            Symbol: blast,
            bgColor: 'rgba(252, 252, 3, 0.12)',
            textColor: 'rgba(252, 252, 3, 1) ',
          }
        : {
            Symbol: blastLight,
            bgColor: 'rgba(252, 252, 3, 0.16)',
            textColor: 'rgba(17, 20, 12, 1)',
          }
    default:
      return undefined
  }
}

const getDefaultBorderRadius = (size: number) => size / 2 - 4

type ChainLogoProps = {
  chainId: ChainId
  className?: string
  size?: number
  borderRadius?: number
  style?: CSSProperties
  testId?: string
  fillContainer?: boolean
}
export function ChainLogo({
  chainId,
  className,
  style,
  size = 12,
  borderRadius = getDefaultBorderRadius(size),
  testId,
  fillContainer = false,
}: ChainLogoProps) {
  const darkMode = useIsDarkMode()
  const { surface2 } = useTheme()
  const isSupportedChain = useIsSupportedChainId(chainId)

  if (!isSupportedChain) return null
  const { label } = getChainInfo({ chainId })

  const { Symbol, bgColor } = getChainUI(chainId, darkMode)
  const iconSize = fillContainer ? '100%' : size

  return (
    <svg
      width={iconSize}
      height={iconSize}
      className={className}
      style={{ ...style, width: iconSize, height: iconSize }}
      aria-labelledby="titleID"
      data-testid={testId}
    >
      <title id="titleID">{`${label} logo`}</title>
      <rect rx={borderRadius} fill={surface2} width={iconSize} height={iconSize} />
      <rect rx={borderRadius} fill={bgColor} width={iconSize} height={iconSize} />
      <Symbol width={iconSize} height={iconSize} />
    </svg>
  )
}
