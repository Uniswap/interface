import { useWeb3React } from '@web3-react/core'
import { SupportedChainId } from 'constants/chains'
import { PropsWithChildren } from 'react'
import styled, { css, DefaultTheme } from 'styled-components/macro'

const getShadowForChainId = (theme: DefaultTheme, chainId?: SupportedChainId) => {
  switch (chainId) {
    case SupportedChainId.ARBITRUM_ONE:
    case SupportedChainId.ARBITRUM_RINKEBY:
      return theme.networkArbitrumShadow
    case SupportedChainId.OPTIMISM:
    case SupportedChainId.OPTIMISM_GOERLI:
      return theme.networkOptimismShadow
    case SupportedChainId.POLYGON:
    case SupportedChainId.POLYGON_MUMBAI:
      return theme.networkPolygonShadow
    case SupportedChainId.CELO:
    case SupportedChainId.CELO_ALFAJORES:
      return theme.networkCeloShadow
    default:
      return theme.networkDefaultShadow
  }
}

// Base style to use in places where we cannot wrap `GlowEffect` and `NetworkGlowEffect`
// with a `styled` function
export const glowEffect = css<{ chainId?: SupportedChainId }>`
  box-shadow: ${({ theme, chainId }) => getShadowForChainId(theme, chainId)};
`

// Base GlowEffect component that renders a glow effect for a given chainId
export const GlowEffect = styled.div<{ chainId?: SupportedChainId }>`
  border-radius: 16px;
  ${glowEffect}
`

// GlowEffect component that automatically adjusts its appearance based on `chainId`
export function NetworkGlowEffect({ className, children }: PropsWithChildren<{ className?: string }>) {
  const { chainId } = useWeb3React()
  return (
    <GlowEffect chainId={chainId} className={className}>
      {children}
    </GlowEffect>
  )
}
