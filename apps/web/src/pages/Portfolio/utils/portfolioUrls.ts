import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isEVMAddress } from 'utilities/src/addresses/evm/evm'
import { isSVMAddress } from 'utilities/src/addresses/svm/svm'
import { isPortfolioTab, PortfolioTab } from '~/pages/Portfolio/types'
import { getChainUrlParam } from '~/utils/chainParams'

interface BuildPortfolioUrlOptions {
  tab?: PortfolioTab
  chainId?: UniverseChainId
  externalAddress?: Address
}

/**
 * Builds a portfolio URL with optional chain parameter and external wallet address
 * @param options - Configuration options for building the URL
 * @param options.tab - The portfolio tab to navigate to
 * @param options.chainId - Optional chain ID to include in the URL
 * @param options.externalAddress - Optional external wallet address to include in the URL
 * @returns The complete portfolio URL with chain parameter if provided
 */
export function buildPortfolioUrl({ tab, chainId, externalAddress }: BuildPortfolioUrlOptions): string {
  const basePortfolioPath = externalAddress ? `/portfolio/${externalAddress}` : '/portfolio'
  const isOverview = !tab || tab === PortfolioTab.Overview
  const tabPath = isOverview ? '' : `/${tab}`
  const chainParam = chainId ? `?chain=${getChainUrlParam(chainId)}` : ''

  return `${basePortfolioPath}${tabPath}${chainParam}`
}

/**
 * Maps a portfolio path to a PortfolioTab enum value
 * Handles both standard paths (/portfolio/tokens) and external wallet paths (/portfolio/<address>/tokens)
 * @param path - The portfolio path (e.g., '/portfolio', '/portfolio/tokens', '/portfolio/<address>/tokens')
 * @returns The corresponding PortfolioTab or undefined if not found
 */
export function pathToPortfolioTab(path: string): PortfolioTab | undefined {
  // Standard pathname to tab mapping
  const PATHNAME_TO_TAB: Partial<Record<string, PortfolioTab>> = {
    '/portfolio': PortfolioTab.Overview,
    '/portfolio/tokens': PortfolioTab.Tokens,
    '/portfolio/defi': PortfolioTab.Defi,
    '/portfolio/nfts': PortfolioTab.Nfts,
    '/portfolio/activity': PortfolioTab.Activity,
  }

  // First check direct path match
  const directMatch = PATHNAME_TO_TAB[path]
  if (directMatch !== undefined) {
    return directMatch
  }

  // Check for external wallet paths: /portfolio/<address>/tab
  const segments = path.split('/').filter(Boolean)
  if (segments[0] === 'portfolio' && segments.length >= 2) {
    // If third segment exists and is a known tab, return it
    const lastSegment = segments[segments.length - 1]
    if (isPortfolioTab(lastSegment)) {
      return lastSegment
    }

    // If second segment is a valid address and no tab segment, it's overview
    const potentialAddress = segments[1]
    if ((isEVMAddress(potentialAddress) || isSVMAddress(potentialAddress)) && segments.length === 2) {
      return PortfolioTab.Overview
    }
  }

  return undefined
}
