import { PortfolioTab } from 'pages/Portfolio/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainUrlParam } from 'utils/chainParams'

/**
 * Builds a portfolio URL with optional chain parameter
 * @param tab - The portfolio tab to navigate to
 * @param chainId - Optional chain ID to include in the URL
 * @returns The complete portfolio URL with chain parameter if provided
 */
export function buildPortfolioUrl(tab: PortfolioTab | undefined, chainId: UniverseChainId | undefined): string {
  const chainUrlParam = chainId ? getChainUrlParam(chainId) : ''
  const currentPath = tab === PortfolioTab.Overview ? '/portfolio' : `/portfolio/${tab}`
  return `${currentPath}${chainId ? `?chain=${chainUrlParam}` : ''}`
}

/**
 * Maps a portfolio path to a PortfolioTab enum value
 * @param path - The portfolio path (e.g., '/portfolio', '/portfolio/tokens')
 * @returns The corresponding PortfolioTab or undefined if not found
 */
export function pathToPortfolioTab(path: string): PortfolioTab | undefined {
  const PATHNAME_TO_TAB: Partial<Record<string, PortfolioTab>> = {
    '/portfolio': PortfolioTab.Overview,
    '/portfolio/tokens': PortfolioTab.Tokens,
    '/portfolio/defi': PortfolioTab.Defi,
    '/portfolio/nfts': PortfolioTab.Nfts,
    '/portfolio/activity': PortfolioTab.Activity,
  }
  return PATHNAME_TO_TAB[path]
}
