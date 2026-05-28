import { useLocation, useParams } from 'react-router'
import { ExploreTab } from '~/types/explore'

// Disambiguate URL params: useParams struggles with /explore/:chainName vs /explore/:tab
export function useExploreParams(): {
  tab?: ExploreTab
  chainName?: string
  tokenAddress?: string
} {
  const { tab, chainName, tokenAddress } = useParams<{ tab: string; chainName: string; tokenAddress: string }>()
  const isLegacyUrl = !useLocation().pathname.includes('explore')

  const exploreTabs = Object.values(ExploreTab)
  if (tab && !chainName && exploreTabs.includes(tab as ExploreTab)) {
    // /explore/:tab
    return { tab: tab as ExploreTab, chainName: undefined, tokenAddress }
  } else if (tab && !chainName) {
    // /explore/:chainName
    return { tab: undefined, chainName: tab, tokenAddress }
  } else if (isLegacyUrl && !tab) {
    // legacy /tokens, /tokens/:chainName, and /tokens/:chainName/:tokenAddress
    return { tab: ExploreTab.Tokens, chainName, tokenAddress }
  } else if (!tab) {
    // /explore
    return { tab: undefined, chainName: undefined, tokenAddress: undefined }
  } else {
    // /explore/:tab/:chainName
    return { tab: tab as ExploreTab, chainName, tokenAddress }
  }
}
