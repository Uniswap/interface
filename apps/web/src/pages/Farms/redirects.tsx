import { Navigate, useLocation, useParams } from 'react-router-dom'

import Farms, { LiquidityTab } from '.'

// This function is needed to disambiguate URL params because useParams struggles to distinguish between /explore/:chainName and /explore/:tab
export function useExploreParams(): {
  tab?: LiquidityTab
  chainName?: string
  tokenAddress?: string
} {
  const { tab, chainName, tokenAddress } = useParams<{ tab: string; chainName: string; tokenAddress: string }>()
  const isLegacyUrl = !useLocation().pathname.includes('farms')

  const exploreTabs = Object.values(LiquidityTab)
  if (tab && !chainName && exploreTabs.includes(tab as LiquidityTab)) {
    // /explore/:tab
    return { tab: tab as LiquidityTab, chainName: undefined, tokenAddress }
  } else if (tab && !chainName) {
    // /explore/:chainName
    return { tab: undefined, chainName: tab, tokenAddress }
  } else if (isLegacyUrl && !tab) {
    // legacy /tokens, /tokens/:chainName, and /tokens/:chainName/:tokenAddress
    return { tab: LiquidityTab.Incentives, chainName, tokenAddress }
  } else if (!tab) {
    // /explore
    return { tab: undefined, chainName: undefined, tokenAddress: undefined }
  } else {
    // /explore/:tab/:chainName
    return { tab: tab as LiquidityTab, chainName, tokenAddress }
  }
}
export default function RedirectExplore() {
  const { tab, chainName, tokenAddress } = useExploreParams()
  const isLegacyUrl = !useLocation().pathname.includes('farms')

  if (!tab) {
    return <Navigate to={`/farms/${LiquidityTab.Incentives}`} replace />
  }

  if (isLegacyUrl) {
    if (tab && chainName && tokenAddress) {
      return <Navigate to={`/farms/${tab}/${chainName}/${tokenAddress}`} replace />
    } else if (chainName && tokenAddress) {
      return <Navigate to={`/farms/tokens/${chainName}/${tokenAddress}`} replace />
    } else if (tab && chainName) {
      return <Navigate to={`/farms/${tab}/${chainName}`} replace />
    }
  }

  return <Farms initialTab={tab} />
}
