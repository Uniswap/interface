import { ChainId } from '@taraswap/sdk-core'
import { getChain, SupportedInterfaceChainId, useIsSupportedChainId } from 'constants/chains'
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
  TARAXA_LOGO,
  ZKSYNC_LOGO,
  ZORA_LOGO,
} from 'ui/src/assets'

type ChainUI = { symbol: string; bgColor: string; textColor: string }

export function getChainUI(chainId: SupportedInterfaceChainId, darkMode: boolean): ChainUI
export function getChainUI(chainId: ChainId, darkMode: boolean): ChainUI | undefined {
  switch (chainId) {
    case ChainId.MAINNET:
    case ChainId.GOERLI:
    case ChainId.SEPOLIA:
      return {
        symbol: ETHEREUM_LOGO,
        bgColor: '#6B8AFF33',
        textColor: '#6B8AFF',
      }
    case ChainId.POLYGON:
    case ChainId.POLYGON_MUMBAI:
      return {
        symbol: POLYGON_LOGO,
        bgColor: '#9558FF33',
        textColor: '#9558FF',
      }
    case ChainId.ARBITRUM_ONE:
    case ChainId.ARBITRUM_GOERLI:
      return {
        symbol: ARBITRUM_LOGO,
        bgColor: '#00A3FF33',
        textColor: '#00A3FF',
      }
    case ChainId.OPTIMISM:
    case ChainId.OPTIMISM_GOERLI:
      return {
        symbol: OPTIMISM_LOGO,
        bgColor: '#FF042033',
        textColor: '#FF0420',
      }
    case ChainId.CELO:
    case ChainId.CELO_ALFAJORES:
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
    case ChainId.AVALANCHE:
      return {
        symbol: AVALANCHE_LOGO,
        bgColor: '#E8414233',
        textColor: '#E84142',
      }
    case ChainId.BNB:
      return {
        symbol: BNB_LOGO,
        bgColor: '#EAB20033',
        textColor: '#EAB200',
      }
    case ChainId.BASE:
      return {
        symbol: BASE_LOGO,
        bgColor: '#0052FF33',
        textColor: '#0052FF',
      }
    case ChainId.BLAST:
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
    case ChainId.ZORA:
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
    case ChainId.ZKSYNC:
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
    case ChainId.TARAXA_TESTNET:
      return {
        symbol: TARAXA_LOGO,
        bgColor: 'rgba(30,34,49,1)',
        textColor: '#15AC5B',
      }
    case ChainId.TARAXA:
      return {
        symbol: TARAXA_LOGO,
        bgColor: 'rgba(30,34,49,1)',
        textColor: '#15AC5B',
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
