import { useWeb3React } from '@web3-react/core'
import { SupportedChainId } from 'constants/chains'
import { PropsWithChildren } from 'react'
import styled, { DefaultTheme, useTheme } from 'styled-components/macro'

export const GlowEffect = styled.div<{ shadow?: string }>`
  border-radius: 16px;
  box-shadow: ${({ theme, shadow }) => shadow ?? theme.networkDefaultShadow};
`

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

export function NetworkGlowEffect({ className, children }: PropsWithChildren<{ className?: string }>) {
  const { chainId } = useWeb3React()
  const theme = useTheme()

  const shadow = getShadowForChainId(theme, chainId)

  return (
    <GlowEffect shadow={shadow} className={className}>
      {children}
    </GlowEffect>
  )
}
