import { useParams } from 'react-router-dom'

import EarnPage, { EarnTab } from '.'

// This function is needed to disambiguate URL params because useParams struggles to distinguish between /earn/:chainName and /earn/:tab
export function useEarnParams(): {
  tab?: EarnTab
  chainName?: string
  tokenAddress?: string
} {
  const { tab, chainName } = useParams<{ tab: string; chainName: string; tokenAddress: string }>()

  const earnTabs = Object.values(EarnTab)
  if (tab && !chainName && earnTabs.includes(tab as EarnTab)) {
    // /earn/:tab
    return { tab: tab as EarnTab, chainName: 'CELO' }
  } else if (tab && !chainName) {
    // /earn/:chainName
    throw new Error('No multichain now')
    // return { tab: undefined, chainName: tab }
  } else if (!tab) {
    // /earn
    return { tab: undefined, chainName: 'CELO' }
  } else {
    // /earn/:tab/:chainName
    return { tab: tab as EarnTab, chainName: 'CELO' }
  }
}
export default function RedirectEarn() {
  const { tab } = useEarnParams()
  // const isLegacyUrl = !useLocation().pathname.includes('explore')
  // if (isLegacyUrl) {
  //   if (tab && chainName && tokenAddress) {
  //     return <Navigate to={`/explore/${tab}/${chainName}/${tokenAddress}`} replace />
  //   } else if (chainName && tokenAddress) {
  //     return <Navigate to={`/explore/tokens/${chainName}/${tokenAddress}`} replace />
  //   } else if (tab && chainName) {
  //     return <Navigate to={`/explore/${tab}/${chainName}`} replace />
  //   }
  // }

  return <EarnPage initialTab={tab} />
}
