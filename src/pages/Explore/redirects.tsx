import { Navigate, useParams } from 'react-router-dom'

import Explore, { ExploreTab } from '.'

// useParams struggles to distinguish between /explore/:chainId and /explore/:tab
export function useExploreParams() {
  const { tab, chainName, tokenAddress } = useParams<{ tab: string; chainName: string; tokenAddress: string }>()
  const exploreTabs = Object.values(ExploreTab)
  if (!tab && chainName && exploreTabs.includes(chainName as ExploreTab)) {
    return { tab: chainName, undefined, tokenAddress }
  } else {
    return { tab, chainName, tokenAddress }
  }
}
export default function RedirectExplore() {
  const { tab, chainName, tokenAddress } = useExploreParams()

  if (tab && chainName && tokenAddress) {
    return <Navigate to={`/explore/${tab}/${chainName}/${tokenAddress}`} replace />
  } else if (tab && chainName) {
    return <Navigate to={`/explore/${tab}/${chainName}`} replace />
  } else if (chainName && tokenAddress) {
    return <Navigate to={`/explore/tokens/${chainName}/${tokenAddress}`} replace />
  } else if (!tab) {
    return <Navigate to="/explore/tokens" replace />
  }

  return <Explore initialTab={tab as ExploreTab} />
}
