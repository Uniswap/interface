import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { PortfolioTab } from 'pages/Portfolio/types'
import { useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainIdFromChainUrlParam, isChainUrlParam } from 'utils/chainParams'

const PATHNAME_TO_TAB: Partial<Record<string, PortfolioTab>> = {
  '/portfolio': PortfolioTab.Overview,
  '/portfolio/tokens': PortfolioTab.Tokens,
  '/portfolio/defi': PortfolioTab.Defi,
  '/portfolio/nfts': PortfolioTab.Nfts,
  '/portfolio/activity': PortfolioTab.Activity,
}

export function usePortfolioRoutes(): {
  tab?: PortfolioTab
  chainName?: string
  chainId?: UniverseChainId
} {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isPortfolioDefiTabEnabled = useFeatureFlag(FeatureFlags.PortfolioDefiTab)

  // Get tab from pathname mapping
  const tab = PATHNAME_TO_TAB[pathname] ?? PortfolioTab.Overview

  // Redirect to overview if trying to access DeFi tab when feature flag is disabled
  useEffect(() => {
    if (tab === PortfolioTab.Defi && !isPortfolioDefiTabEnabled) {
      navigate('/portfolio', { replace: true })
    }
  }, [tab, isPortfolioDefiTabEnabled, navigate])

  // Get chainName from query parameters
  const chainNameParam = searchParams.get('chain')
  const chainName = chainNameParam && isChainUrlParam(chainNameParam) ? chainNameParam : undefined
  const chainId = chainName ? getChainIdFromChainUrlParam(chainName) : undefined

  return { tab, chainName, chainId }
}
