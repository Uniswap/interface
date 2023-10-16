import { Navigate, useParams } from 'react-router-dom'

import Explore, { ExploreTab } from '.'

// useParams struggles to distinguish between /explore/:chainId and /explore/:tab
export function useExploreParams() {
  const { tab, chainName, tokenAddress } = useParams<{ tab: string; chainName: string; tokenAddress: string }>()
  const exploreTabs = Object.values(ExploreTab)
  if (tab && !chainName && exploreTabs.includes(tab as ExploreTab)) {
    // /explore/:tab
    return { tab, chainName: undefined, tokenAddress }
  } else if (tab && !chainName) {
    // /explore/:chainName
    return { tab: ExploreTab.Tokens, chainName: tab, tokenAddress }
  } else if (!tab && !chainName) {
    // legacy /tokens
    return { tab: ExploreTab.Tokens, chainName: undefined, tokenAddress: undefined }
  } else {
    // /explore/:tab/:chainName
    return { tab, chainName, tokenAddress }
  }
}
export default function RedirectExplore() {
  const { tab, chainName, tokenAddress } = useExploreParams()
  if (tab && chainName && tokenAddress) {
    return <Navigate to={`/explore/${tab}/${chainName}/${tokenAddress}`} replace />
  } else if (chainName && tokenAddress) {
    return <Navigate to={`/explore/tokens/${chainName}/${tokenAddress}`} replace />
  } else if (tab && chainName) {
    return <Navigate to={`/explore/${tab}/${chainName}`} replace />
  } else if (chainName) {
    return <Navigate to={`/explore/tokens/${chainName}`} replace />
  }
  return <Explore initialTab={tab as ExploreTab} />
}
