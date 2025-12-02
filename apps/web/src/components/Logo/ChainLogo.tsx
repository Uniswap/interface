import { CSSProperties } from 'react'
import { FlexProps } from 'ui/src/components/layout'

import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'

const getDefaultBorderRadius = (size: number) => size / 2 - 4

type ChainLogoProps = {
  chainId: UniverseChainId
  className?: string
  size?: number
  borderRadius?: number
  style?: CSSProperties
  testId?: string
  fillContainer?: boolean
  transition?: FlexProps['transition']
}
export function ChainLogo({
  chainId,
  style,
  size = 12,
  borderRadius = getDefaultBorderRadius(size),
  testId,
  fillContainer = false,
  transition,
}: ChainLogoProps) {
  const isSupportedChain = isUniverseChainId(chainId)

  if (!isSupportedChain) {
    return null
  }

  const { label, logo } = getChainInfo(chainId)
  const iconSize = fillContainer ? '100%' : size + 'px'

  return (
    <img
      aria-labelledby="titleID"
      data-testid={testId}
      width={iconSize}
      height={iconSize}
      src={logo as string}
      style={{ ...style, borderRadius: borderRadius + 'px', transition }}
      alt={`${label} logo`}
    />
  )
}
