import { useParams } from 'react-router-dom'

import LaunchpadListPage, { LaunchpadTab } from '.'

// This function is needed to disambiguate URL params because useParams struggles to distinguish between /earn/:chainName and /earn/:tab
export function useLaunchpadParams(): {
  tab?: LaunchpadTab
  chainName?: string
  tokenAddress?: string
} {
  const { tab, chainName } = useParams<{ tab: string; chainName: string; tokenAddress: string }>()

  const launchpadsTabs = Object.values(LaunchpadTab)
  if (tab && !chainName && launchpadsTabs.includes(tab as LaunchpadTab)) {
    // /earn/:tab
    return { tab: tab as LaunchpadTab, chainName: 'CELO' }
  } else if (tab && !chainName) {
    // /earn/:chainName
    throw new Error('No multichain now')
    // return { tab: undefined, chainName: tab }
  } else if (!tab) {
    // /earn
    return { tab: undefined, chainName: 'CELO' }
  } else {
    // /earn/:tab/:chainName
    return { tab: tab as LaunchpadTab, chainName: 'CELO' }
  }
}
export default function RedirectEarn() {
  const { tab } = useLaunchpadParams()

  return <LaunchpadListPage initialTab={tab} />
}
