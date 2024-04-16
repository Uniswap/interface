import { ChainId } from '@jaguarswap/sdk-core'
import { getChainInfo } from 'constants/chainInfo'
import { isSupportedChain, SupportedInterfaceChain } from 'constants/chains'
import { CSSProperties, FunctionComponent } from 'react'
import { useTheme } from 'styled-components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

import { ReactComponent as arbitrum } from './ChainSymbols/arbitrum.svg'
import { ReactComponent as avax } from './ChainSymbols/avax.svg'
import { ReactComponent as base } from './ChainSymbols/base.svg'
import { ReactComponent as bnb } from './ChainSymbols/bnb.svg'
import { ReactComponent as celo } from './ChainSymbols/celo.svg'
import { ReactComponent as celoLight } from './ChainSymbols/celo_light.svg'
import { ReactComponent as ethereum } from './ChainSymbols/ethereum.svg'
import { ReactComponent as optimism } from './ChainSymbols/optimism.svg'
import { ReactComponent as polygon } from './ChainSymbols/polygon.svg'
import { ReactComponent as okx } from './ChainSymbols/okx.svg'

type SVG = FunctionComponent<React.SVGProps<SVGSVGElement>>
type ChainUI = { Symbol: SVG; bgColor: string; textColor: string }

export function getChainUI(chainId: SupportedInterfaceChain, darkMode: boolean): ChainUI
export function getChainUI(chainId: ChainId, darkMode: boolean): ChainUI | undefined {
  switch (chainId) {
    case ChainId.X1:
      return {
        Symbol: ethereum,
        bgColor: '#6B8AFF33',
        textColor: '#6B8AFF',
      }
    case ChainId.X1_TESTNET:
      return {
        Symbol: okx,
        bgColor: '#0052FF33',
        textColor: '#0052FF',
      }
    default:
      return undefined
  }
}

export const getDefaultBorderRadius = (size: number) => size / 2 - 4

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

  if (!isSupportedChain(chainId)) return null
  const { label } = getChainInfo(chainId)

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
