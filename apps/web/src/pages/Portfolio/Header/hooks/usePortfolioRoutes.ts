import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PlatformAddress } from 'uniswap/src/features/platforms/types/PlatformSpecificAddress'
import { getPlatformAddress } from 'uniswap/src/features/platforms/utils/addresses'
import { useActiveAddresses } from '~/features/accounts/store/hooks'
import { isPortfolioTab, PortfolioTab } from '~/pages/Portfolio/types'
import { buildPortfolioUrl, pathToPortfolioTab } from '~/pages/Portfolio/utils/portfolioUrls'
import { getChainIdFromChainUrlParam, isChainUrlParam } from '~/utils/chainParams'

/**
 * Parses portfolio URL segments to extract wallet address and tab
 * URL formats:
 * - /portfolio -> Overview tab, no external wallet
 * - /portfolio/tokens -> Tokens tab, no external wallet
 * - /portfolio/0x123... -> Overview tab, external wallet 0x123...
 * - /portfolio/0x123.../tokens -> Tokens tab, external wallet 0x123...
 */
function parsePortfolioPath(pathname: string): {
  potentialAddress: string | undefined
  tabSegment: string | undefined
} {
  const segments = pathname.split('/').filter(Boolean)

  // Only parse if this is a portfolio path
  if (segments[0] !== 'portfolio') {
    return { potentialAddress: undefined, tabSegment: undefined }
  }

  // segments[0] is 'portfolio'
  const firstSegment = segments[1] // Could be tab or wallet address
  const secondSegment = segments[2] // Could be tab if first is address

  // If first segment is a known tab name, no external wallet
  if (isPortfolioTab(firstSegment)) {
    return { potentialAddress: undefined, tabSegment: firstSegment }
  }

  // First segment might be a wallet address
  return {
    potentialAddress: firstSegment,
    tabSegment: secondSegment,
  }
}

export function usePortfolioRoutes(): {
  tab: PortfolioTab
  chainName?: string
  chainId?: UniverseChainId
  externalAddress?: PlatformAddress
  isExternalWallet: boolean
} {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isPortfolioDefiTabEnabled = useFeatureFlag(FeatureFlags.PortfolioDefiTab)

  const { potentialAddress, tabSegment } = useMemo(() => parsePortfolioPath(pathname), [pathname])
  const { evmAddress, svmAddress } = useActiveAddresses()

  const externalAddress = getPlatformAddress(potentialAddress)
  const isOwnEvmAddress = evmAddress?.toLowerCase() === potentialAddress?.toLowerCase()
  const isOwnSvmAddress = svmAddress === potentialAddress
  const isExternalWallet = Boolean(externalAddress) && !isOwnEvmAddress && !isOwnSvmAddress

  const tab = useMemo(() => {
    if (isPortfolioTab(tabSegment)) {
      return tabSegment
    }
    // Fall back to pathToPortfolioTab for non-external wallet URLs
    if (!potentialAddress) {
      return pathToPortfolioTab(pathname) ?? PortfolioTab.Overview
    }
    return PortfolioTab.Overview
  }, [tabSegment, potentialAddress, pathname])

  // Get chainName from query parameters
  const chainNameParam = searchParams.get('chain')
  const chainName = chainNameParam && isChainUrlParam(chainNameParam) ? chainNameParam : undefined
  const chainId = chainName ? getChainIdFromChainUrlParam(chainName) : undefined

  useEffect(() => {
    // Redirect to /portfolio if URL contains an invalid address
    if (potentialAddress && (!externalAddress || isOwnEvmAddress || isOwnSvmAddress)) {
      navigate('/portfolio', { replace: true })
      return // Stop processing other redirects
    }

    // Redirect to overview if trying to access DeFi tab when feature flag is disabled
    if (tab === PortfolioTab.Defi && !isPortfolioDefiTabEnabled) {
      navigate(buildPortfolioUrl({ chainId, externalAddress: externalAddress?.address }), { replace: true })
    }
  }, [
    potentialAddress,
    externalAddress,
    tab,
    isPortfolioDefiTabEnabled,
    navigate,
    chainId,
    isOwnEvmAddress,
    isOwnSvmAddress,
  ])

  return { tab, chainName, chainId, externalAddress, isExternalWallet }
}
