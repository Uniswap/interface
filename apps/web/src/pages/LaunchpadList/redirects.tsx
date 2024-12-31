import { useParams } from 'react-router-dom'
import LaunchpadListPage, { LaunchpadTab } from '.'
import UbestarterParticles from '../../components/particles/UbestarterParticles'

export function useLaunchpadParams(): {
  tab?: LaunchpadTab
  chainName?: string
  tokenAddress?: string
} {
  const { tab, chainName } = useParams<{
    tab: string
    chainName: string
    tokenAddress: string
  }>()

  const launchpadsTabs = Object.values(LaunchpadTab)

  if (tab && !chainName && launchpadsTabs.includes(tab as LaunchpadTab)) {
    return { tab: tab as LaunchpadTab, chainName: 'CELO' }
  } else if (tab && !chainName) {
    throw new Error('No multichain now')
  } else if (!tab) {
    return { tab: undefined, chainName: 'CELO' }
  } else {
    return { tab: tab as LaunchpadTab, chainName: 'CELO' }
  }
}

export default function RedirectEarn() {
  const { tab } = useLaunchpadParams()

  return (
    <>
      <div className="fixed inset-0 w-full h-full overflow-hidden">
        <UbestarterParticles />
      </div>

      <div className="relative w-full">
        <LaunchpadListPage initialTab={tab} />
      </div>
    </>
  )
}
