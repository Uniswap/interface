import { SupportedChainId } from 'constants/chains'
import { css, DefaultTheme } from 'styled-components/macro'

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

export const glowEffect = css<{ chainId?: SupportedChainId }>`
  border-radius: 16px;
  box-shadow: ${({ theme, chainId }) => getShadowForChainId(theme, chainId)};
`
