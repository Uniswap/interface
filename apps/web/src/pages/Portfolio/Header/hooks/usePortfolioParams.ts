import { PortfolioTab } from 'pages/Portfolio/types'
import { useLocation, useSearchParams } from 'react-router'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainIdFromChainUrlParam, isChainUrlParam } from 'utils/chainParams'

const PATHNAME_TO_TAB: Partial<Record<string, PortfolioTab>> = {
  '/portfolio': PortfolioTab.Overview,
  '/portfolio/tokens': PortfolioTab.Tokens,
  '/portfolio/defi': PortfolioTab.Defi,
  '/portfolio/nfts': PortfolioTab.Nfts,
  '/portfolio/activity': PortfolioTab.Activity,
}

export function usePortfolioParams(): {
  tab?: PortfolioTab
  chainName?: string
  chainId?: UniverseChainId
} {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()

  // Get tab from pathname mapping
  const tab = PATHNAME_TO_TAB[pathname] ?? PortfolioTab.Overview

  // Get chainName from query parameters
  const chainNameParam = searchParams.get('chain')
  const chainName = chainNameParam && isChainUrlParam(chainNameParam) ? chainNameParam : undefined
  const chainId = chainName ? getChainIdFromChainUrlParam(chainName) : undefined

  return { tab, chainName, chainId }
}
